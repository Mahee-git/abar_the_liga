// 1) Paste your Firebase web-app config here (Firebase Console > Project settings > Your apps > Web app)
export const cfg = {
  apiKey: "AIzaSyA7dgXcbxNFxqM629_fYCs1D0ZANH6Ths8",
  authDomain: "abar-f2787.firebaseapp.com",
  projectId: "abar-f2787",
  storageBucket: "abar-f2787.firebasestorage.app",
  messagingSenderId: "949007943159",
  appId: "1:949007943159:web:2ab77f6ca2f64aade41af2"
};
export const ADMINS = ["mahe@me.com"];
// Game settings (all amounts in millions)
export const START = 200, WIN_BONUS = 40, SECOND_BONUS = 20, MAX_SEASONS = 3, MIN_STEP = 1;
// Formations: rows from attack to defence
export const FORMATIONS = {
  "4-3-3": [["LW","ST","RW"],["CM","CM","CM"],["LB","CB","CB","RB"],["GK"]],

  "4-1-2-3": [["LW","ST","RW"],["CM","CM"],["DM"],["LB","CB","CB","RB"],["GK"]],

  "4-2-1-3": [["LW","ST","RW"],["AM"],["DM","DM"],["LB","CB","CB","RB"],["GK"]],

  "4-2-2-2": [["ST","ST"],["AM","AM"],["DM","DM"],["LB","CB","CB","RB"],["GK"]],

  "4-3-1-2": [["ST","ST"],["AM"],["CM","CM","CM"],["LB","CB","CB","RB"],["GK"]],

  "4-1-3-2": [["ST","ST"],["LM","CM","RM"],["DM"],["LB","CB","CB","RB"],["GK"]],

  "4-2-4": [["LW","ST","ST","RW"],["DM","DM"],["LB","CB","CB","RB"],["GK"]],

  "4-4-2": [["ST","ST"],["LM","CM","CM","RM"],["LB","CB","CB","RB"],["GK"]],

  "4-2-3-1": [["ST"],["LW","AM","RW"],["DM","DM"],["LB","CB","CB","RB"],["GK"]],

  "4-3-2-1": [["ST"],["AM","AM"],["CM","CM","CM"],["LB","CB","CB","RB"],["GK"]],

  "4-1-4-1": [["ST"],["LM","CM","CM","RM"],["DM"],["LB","CB","CB","RB"],["GK"]],

  "3-4-3": [["LW","ST","RW"],["LM","CM","CM","RM"],["CB","CB","CB"],["GK"]],

  "3-2-4-1": [["ST"],["LW","AM","AM","RW"],["DM","DM"],["CB","CB","CB"],["GK"]],

  "3-2-3-2": [["ST","ST"],["LM","AM","RM"],["DM","DM"],["CB","CB","CB"],["GK"]],

  "3-1-3-3": [["LW","ST","RW"],["LM","CM","RM"],["DM"],["CB","CB","CB"],["GK"]],

  "3-1-4-2": [["ST","ST"],["LM","CM","CM","RM"],["DM"],["CB","CB","CB"],["GK"]],

  "5-2-1-2": [["ST","ST"],["AM"],["CM","CM"],["LWB","CB","CB","CB","RWB"],["GK"]],

  "5-1-2-2": [["ST","ST"],["CM","CM"],["DM"],["LWB","CB","CB","CB","RWB"],["GK"]],

  "5-3-2": [["ST","ST"],["CM","CM","CM"],["LWB","CB","CB","CB","RWB"],["GK"]],

  "5-4-1": [["ST"],["LM","CM","CM","RM"],["LWB","CB","CB","CB","RWB"],["GK"]],

  "4-1-2-3 (compact)": [["LW","ST","RW"],["AM","AM"],["DM"],["LB","CB","CB","RB"],["GK"]]
};
