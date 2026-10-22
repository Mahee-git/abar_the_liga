// 1) Paste your Firebase web-app config here (Firebase Console > Project settings > Your apps > Web app)
export const cfg = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  appId: "PASTE_APP_ID"
};
// 2) Emails that are league admins (also put the same emails in firestore.rules)
export const ADMINS = ["you@example.com"];
// Game settings (all amounts in millions)
export const START = 200, WIN_BONUS = 40, SECOND_BONUS = 20, MAX_SEASONS = 3, MIN_STEP = 1;
// Formations: rows from attack to defence
export const FORMATIONS = {
  "4-3-3": [["LW","ST","RW"],["CM","CM","CM"],["LB","CB","CB","RB"],["GK"]],
  "4-4-2": [["ST","ST"],["LM","CM","CM","RM"],["LB","CB","CB","RB"],["GK"]],
  "4-2-3-1": [["ST"],["LW","AM","RW"],["DM","DM"],["LB","CB","CB","RB"],["GK"]],
  "3-5-2": [["ST","ST"],["LM","CM","AM","CM","RM"],["CB","CB","CB"],["GK"]],
  "5-3-2": [["ST","ST"],["CM","CM","CM"],["LWB","CB","CB","CB","RWB"],["GK"]]
};
