#!/usr/bin/env node
// Usage: node append.js <new-questions.json>
// new-questions.json must be an array of question objects

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTEUDO_PATH = resolve(__dirname, '../../../../src/data/conteudo.json');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node append.js <new-questions.json>');
  process.exit(1);
}

const newItems = JSON.parse(readFileSync(inputPath, 'utf8'));
if (!Array.isArray(newItems)) {
  console.error('Input file must be a JSON array of question objects.');
  process.exit(1);
}

const conteudo = JSON.parse(readFileSync(CONTEUDO_PATH, 'utf8'));
const existingIds = new Set(conteudo.questoes.map(q => q.id));

const toInsert = newItems.filter(q => {
  if (existingIds.has(q.id)) {
    console.warn(`Skipping duplicate id: ${q.id}`);
    return false;
  }
  return true;
});

conteudo.questoes.push(...toInsert);
writeFileSync(CONTEUDO_PATH, JSON.stringify(conteudo, null, 2), 'utf8');
console.log(`Inserted ${toInsert.length} questions. Total now: ${conteudo.questoes.length}`);
