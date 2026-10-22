# eFootball Auction League
1. Firebase Console: create project > Authentication > enable Email/Password > Firestore Database (production mode).
2. Project settings > add Web app > copy config into `js/firebase-config.js` (apiKey etc). Set ADMINS email(s) there.
3. Paste `firestore.rules` into Firestore > Rules (change the admin email), Publish.
4. Sign up with your admin email. Admin tab > import players CSV (name,pos,rating).
5. Push to GitHub > Settings > Pages > deploy from main. Add your github.io domain in Firebase Auth > Settings > Authorized domains.
Auctions run on Discord; admin logs results in Admin tab. Players submit match results (pending until admin approves). Season end archives table+squads.
Edit game rules/formations in `js/firebase-config.js`; UI in `js/app.js`; styling in `css/style.css`.
