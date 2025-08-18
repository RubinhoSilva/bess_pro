const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://admin:bess123456@localhost:27017/bess-pro?authSource=admin')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define a simple schema
    const testSchema = new mongoose.Schema({
      userId: String,
      name: String
    });
    
    const TestModel = mongoose.model('TestClient', testSchema);
    
    // Test the query that is causing issues
    console.log('Starting query test...');
    const startTime = Date.now();
    
    TestModel.find({ userId: 'test-user' })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10)
      .then(docs => {
        const endTime = Date.now();
        console.log(`Query completed in ${endTime - startTime}ms`);
        console.log(`Found ${docs.length} documents`);
        process.exit(0);
      })
      .catch(error => {
        console.error('Query error:', error);
        process.exit(1);
      });
    
    // Set a timeout to catch hanging queries
    setTimeout(() => {
      console.error('Query timeout after 10 seconds');
      process.exit(1);
    }, 10000);
    
  })
  .catch(error => {
    console.error('Connection error:', error);
    process.exit(1);
  });