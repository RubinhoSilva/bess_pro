import 'reflect-metadata'; // Required for dependency injection
import { ApplicationBootstrap } from './presentation/bootstrap/ApplicationBootstrap';

async function main() {
  const app = new ApplicationBootstrap();
  await app.start();
}

// Start the application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});// restart
// test

 
