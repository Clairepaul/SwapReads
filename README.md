# 📚 SwapReads

SwapReads is a modern book swapping web application that allows readers to exchange books with one another. Users can create an account, upload books they own, browse books shared by others, send swap requests, chat with other readers, and manage their reading community from one platform.

**Live Demo:** https://swapreads-app.netlify.app

**GitHub Repository:** https://github.com/Clairepaul/SwapReads

---

## Features

### User Authentication
- User registration
- Secure login
- Password reset via email
- Change password
- Delete account

### Book Management
- Add books
- Edit books
- Delete books
- Upload cover images
- View detailed book information

### Browse Books
- Browse books shared by other readers
- Search books
- View reader profiles

### Wishlist
- Save books for later
- Remove books from wishlist

### Swap Requests
- Request book swaps
- Accept requests
- Reject requests
- Cancel pending requests
- Complete swaps
- Automatic book status updates

### Messaging
- Real-time messaging between readers
- Read receipts
- Unread message counter
- Conversation list

### Notifications
- Real-time notifications
- Unread notification badge
- Notification settings

### Dashboard
- User statistics
- Recent activity
- Pending requests
- Quick navigation

### User Settings
- Light theme
- Dark theme
- Notification preferences
- Reader visibility settings

---

## Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript (ES6)

### Backend
- Supabase

### Database
- PostgreSQL (Supabase)

### Authentication
- Supabase Authentication

### Storage
- Supabase Storage

### Serverless Functions
- Supabase Edge Functions (Deno)

### Deployment
- Netlify

### Version Control
- Git
- GitHub

---

## Project Structure

```
SwapReads
│
├── src
│   ├── assets
│   ├── css
│   ├── html
│   ├── js
│   └── index.html
│
├── supabase
│   ├── functions
│   └── config.toml
│
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Clairepaul/SwapReads.git
```

Open the project folder:

```bash
cd SwapReads
```

Run a local server.

Example using VS Code Live Server:

```
Right Click → Open with Live Server
```

or

```bash
python -m http.server
```

---

## Configuration

Update your Supabase credentials in your JavaScript configuration:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_ANON_KEY";
```

---

## Future Improvements

- Email notifications
- Book recommendations
- Ratings and reviews
- Admin dashboard
- Mobile application
- AI-powered book suggestions
- QR code book exchanges
- Barcode scanning

---

## Screenshots

Add screenshots here after deployment.

Example:

- SignUp Page
  <img width="1903" height="993" alt="image" src="https://github.com/user-attachments/assets/0532dd31-db3a-4e9b-82c3-27a4efb2acc4" />
- Login Page
  <img width="1920" height="980" alt="image" src="https://github.com/user-attachments/assets/4697a552-c0a2-4ab9-806a-c2f520b0a553" />

- Dashboard - Once logged a user is directed to the dashboard.
  <img width="1920" height="978" alt="image" src="https://github.com/user-attachments/assets/3c07a9f8-be04-4422-8021-9143303a0003" />
- MyBooks page: Users add, view and edit their own books that they want exchange.
  <img width="1913" height="983" alt="image" src="https://github.com/user-attachments/assets/a19847b1-e883-4855-9be8-bc22d6e9e606" />

- Browse Books: User can view all the books available posted by other users, view their details, request a book they like and save to wishlist.
  <img width="1917" height="977" alt="image" src="https://github.com/user-attachments/assets/3b8b65ff-eeab-4b04-ab70-0418b12809c4" />

- Swap Requests: Users can view  incoming requests from other users, accept, decline other users requests and view their own requests to other users.
  <img width="1912" height="985" alt="image" src="https://github.com/user-attachments/assets/68e0e6b7-4b9c-4969-83eb-8638e6bb008e" />
  <img width="1912" height="983" alt="image" src="https://github.com/user-attachments/assets/48eeea81-5a8a-4655-ab90-c865418aa7c9" />

- Messaging: Users can communicate with each other.
  <img width="1902" height="980" alt="image" src="https://github.com/user-attachments/assets/68464f36-179d-49c0-823c-9ff35722ce31" />

- User Profile: Users can Edit and Upload their own details
  <img width="1895" height="981" alt="image" src="https://github.com/user-attachments/assets/c660e373-63c8-4053-a5e3-dab41df4186a" />

- Dark Theme
  <img width="1890" height="983" alt="image" src="https://github.com/user-attachments/assets/d156b58d-84f3-4457-a595-608c83367f4d" />


---

## Author

**Claire Wanjiku**

GitHub: https://github.com/Clairepaul

LinkedIn: *(Add your LinkedIn profile here if you have one.)*

---

## License

This project is intended for educational purposes
