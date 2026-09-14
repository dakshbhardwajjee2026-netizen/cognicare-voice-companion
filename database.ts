import fs from 'fs';
import path from 'path';
import { MongoClient, Db, Collection } from 'mongodb';
import { PatientData } from './types';
import { DEMO_PATIENT } from './constants';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'patients.json');

// Ensure local data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let patientsCollection: Collection<PatientData> | null = null;
let isMongoConnected = false;

// Local JSON File Helper
function readLocalPatients(): Record<string, PatientData> {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const data = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      if (data && data.trim()) {
        return JSON.parse(data);
      }
    }
  } catch (err) {
    console.warn('[Database] Notice reading local DB file:', err);
  }
  // Initialize with demo patient
  const initial: Record<string, PatientData> = {
    'CGN-DEMO1': DEMO_PATIENT,
  };
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

function writeLocalPatients(patients: Record<string, PatientData>): void {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(patients, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to write local DB file:', err);
  }
}

/**
 * Initialize Database Connection (MongoDB Atlas or Fallback File Database)
 */
export async function initDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    console.log('[Database] MONGODB_URI not configured. Operating in Persistent JSON File DB Mode.');
    readLocalPatients(); // Ensure pre-seeded
    return;
  }

  try {
    console.log('[Database] Connecting to MongoDB Atlas cluster...');
    mongoClient = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db('cognicare');
    patientsCollection = mongoDb.collection<PatientData>('patients');
    isMongoConnected = true;
    console.log('[Database] Connected successfully to MongoDB Atlas database: cognicare');

    // Seed demo patient in MongoDB if empty
    const count = await patientsCollection.countDocuments();
    if (count === 0) {
      await patientsCollection.insertOne({ ...DEMO_PATIENT } as any);
      console.log('[Database] Seeded initial demo patient CGN-DEMO1 in MongoDB Atlas.');
    }
  } catch (err: any) {
    console.warn('[Database] MongoDB Atlas connection notice (falling back to Local File DB):', err.message);
    isMongoConnected = false;
    readLocalPatients();
  }
}

/**
 * Retrieve all registered patients
 */
export async function getAllPatients(): Promise<PatientData[]> {
  if (isMongoConnected && patientsCollection) {
    try {
      const docs = await patientsCollection.find({}).toArray();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => {
          const { _id, ...rest } = d;
          return rest as PatientData;
        });
      }
    } catch (err: any) {
      console.warn('[Database] MongoDB fetch failed, falling back to local:', err.message);
    }
  }

  const local = readLocalPatients();
  return Object.values(local);
}

/**
 * Retrieve a specific patient by ID (e.g. CGN-DEMO1, CGN-4892)
 */
export async function getPatientById(id: string): Promise<PatientData | null> {
  const normId = (id || '').trim().toUpperCase();
  if (isMongoConnected && patientsCollection) {
    try {
      const doc = await patientsCollection.findOne({ id: normId });
      if (doc) {
        const { _id, ...rest } = doc as any;
        return rest as PatientData;
      }
    } catch (err: any) {
      console.warn('[Database] MongoDB findOne notice:', err.message);
    }
  }

  const local = readLocalPatients();
  return local[normId] || (normId === 'CGN-DEMO1' || normId === 'DEMO' ? DEMO_PATIENT : null);
}

/**
 * Save or update a patient profile
 */
export async function savePatient(patient: PatientData): Promise<PatientData> {
  const normId = patient.id.trim().toUpperCase();
  const cleanData: PatientData = { ...patient, id: normId };

  // Always write to local storage as safety backup
  const local = readLocalPatients();
  local[normId] = cleanData;
  writeLocalPatients(local);

  if (isMongoConnected && patientsCollection) {
    try {
      await patientsCollection.updateOne(
        { id: normId },
        { $set: cleanData as any },
        { upsert: true }
      );
      console.log(`[Database] Synced patient ${normId} to MongoDB Atlas.`);
    } catch (err: any) {
      console.warn('[Database] MongoDB update notice:', err.message);
    }
  }

  return cleanData;
}

/**
 * Delete a patient profile
 */
export async function deletePatient(id: string): Promise<boolean> {
  const normId = (id || '').trim().toUpperCase();
  const local = readLocalPatients();
  delete local[normId];
  writeLocalPatients(local);

  if (isMongoConnected && patientsCollection) {
    try {
      await patientsCollection.deleteOne({ id: normId });
      return true;
    } catch (err: any) {
      console.warn('[Database] MongoDB delete notice:', err.message);
    }
  }
  return true;
}
