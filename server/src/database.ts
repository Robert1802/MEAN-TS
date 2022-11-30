import * as mongodb from "mongodb";
import { Employee } from "./employee";

export const collections: {
    employees?: mongodb.Collection<Employee>;
} = {};

export async function connectToDatabase(uri: string) {
    const client = new mongodb.MongoClient(uri);
    await client.connect();

    const db = client.db("meanStackExample");
    await applySchemaValidation(db);

    const employeeCollection = db.collection<Employee>("employees");
    collections.employees = employeeCollection;
}

// Update our existing collection with JSON schema validation
// so we know our documents will always match the shape of our Employee model, even if added elsewhere.
async function applySchemaValidation(db: mongodb.Db){
    const jsonSchema = {
        $jsonSchema: {
            bsonType: "object",
            require: ["name", "position", "level"],
            additionalProperties: false,
            properties: {
                _id: {},
                name: {
                    bsonType: "string",
                    descritpion: "'name' is required and is a string",
                },
                position : {
                    bsonType: "string",
                    description: "'position' is required and is a string",
                    minLength: 5
                },
                level: {
                    bsonType: "string",
                    description: "'level' is required and is one of 'junio', 'mid', or 'senior'",
                    enum: ["junior", "mid", "senior"],
                },
            },
        },
    };
    
    // Try applying the modification to the collection,
    // if the collection doesn't exist, create it
    await db.command({
        collMod: "employees",
        validator: jsonSchema
    }).catch(async (error: mongodb.MongoServerError) => {
        if(error.codeName === 'NamespaceNotFoud'){
            await db.createCollection("employees", {validator: jsonSchema});
        }
    })
};


