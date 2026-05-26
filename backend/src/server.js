import './bootstrap/loadEnv.js';

const { default: app } = await import('./app.js');
const { default: connectDB } = await import('./config/db.js');
const { ensureLocalDevAdmin } = await import('./bootstrap/ensureLocalDevAdmin.js');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await ensureLocalDevAdmin();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  });
};

startServer().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
