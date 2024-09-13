const fs = require("fs");
const path = require("path");

const createAssistant = async (openai) => {
  
  const assistantFilePath = "assistant.json";
  
  if (!fs.existsSync(assistantFilePath)) {
    const knowledgeDocsPath = "knowledge_docs"; 
    const knowledgeDocs = fs.readdirSync(knowledgeDocsPath).map((file) => path.join(knowledgeDocsPath, file));

    const fileIds = [];
    for (const docPath of knowledgeDocs) {
      const file = await openai.files.create({
        file: fs.createReadStream(docPath),
        purpose: "assistants",
      });
      fileIds.push(file.id);
    }

    const vectorStore = await openai.beta.vectorStores.create({
      name: "Chat Demo",
      file_ids: fileIds,
    });

    const assistant = await openai.beta.assistants.create({
      name: "Chat Demo",
      instructions: `The assistant has been programmed to provide answers to questions related to Artificial Intelligence in Healthcare.
      Documents have been provided with information on some areas where AI has impacted healthcare.`,
      tools: [{ type: "file_search" }],
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
      model: "gpt-4o",
    });

    fs.writeFileSync(assistantFilePath, JSON.stringify(assistant));
    return assistant;
  } else {
    const assistant = JSON.parse(fs.readFileSync(assistantFilePath));
    return assistant;
  }
};

module.exports = { createAssistant };
