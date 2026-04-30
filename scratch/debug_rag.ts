import dbConnect from "../src/lib/mongodb";
import Knowledge from "../src/models/Knowledge";

async function debugRAG() {
  await dbConnect();
  const count = await Knowledge.countDocuments({});
  console.log(`Total Knowledge Chunks: ${count}`);
  
  if (count > 0) {
    const samples = await Knowledge.find({}).limit(2).select('category content');
    console.log("Sample Categories:", samples.map(s => s.category));
    console.log("Sample Content:", samples.map(s => s.content.slice(0, 50)));
  }
  
  process.exit(0);
}

debugRAG();
