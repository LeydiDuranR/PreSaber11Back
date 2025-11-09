import { admin } from "../config/firebase.js";

export const createFirebaseUser = async (email, password, displayName) => {
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });
    return userRecord.uid;
  } catch (error) {
    throw new Error("Error al crear usuario en Firebase: " + error.message);
  }
};

export const getUserByUid = async (uid) => {
  try {
    return await admin.auth().getUser(uid);
  } catch (error) {
    return null;
  }
};
