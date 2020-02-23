//connect
import * as admin from "firebase-admin";

const serviceAccount = require("../config/YOUR_FILE.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://YOUR_HOST.firebaseio.com"
});

export default admin.database();
