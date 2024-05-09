// todo.js
import express from 'express';
import fs from 'fs';
import path from 'path';


const router = express.Router();
// 현재 파일의 경로는 api-nodeJS/api/todo.js, todo.json 경로는 api-nodeJS/data/todolists/todo.json
const dataPath = path.join(path.resolve(), 'data', 'todolists', 'todo.json');

// 카테고리 데이터 읽기
router.get('/categories', (req, res) => {
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data');
      return;
    }
    res.json(JSON.parse(data));
  });
});

// 카테고리 데이터 수정
router.post('/categories', (req, res) => {
  const updatedCategory = req.body;

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data');
      return;
    }
    const categories = JSON.parse(data);

    Object.keys(updatedCategory).forEach((category) => {
      if (categories[category]) {
        categories[category] = updatedCategory[category];
      } else {
        res.status(404).send(`Category '${category}' not found`);
        return;
      }
    });

    fs.writeFile(dataPath, JSON.stringify(categories, null, 2), 'utf8', (err) => {
      if (err) {
        res.status(500).send('Error writing data');
        return;
      }
      res.send('Category data updated successfully');
    });
  });
});

export default router;
