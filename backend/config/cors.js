module.exports = {
  origin: [
    'https://bieditor-git-main-ajhellquists-projects.vercel.app',
    'https://www.maqlexpress.com',
    'http://localhost:3000',
    'https://bi-editor-b17f5497912d.herokuapp.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Access-Control-Allow-Origin']
}; 