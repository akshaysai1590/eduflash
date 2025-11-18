const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const QUESTIONS = [
  { id:1, q:"What is the capital of France?", choices:["Paris","Berlin","Madrid","Rome"], a:0, explain:"Paris is the capital." },
  { id:2, q:"2 + 3 * 4 = ?", choices:["14","20","10","12"], a:0, explain:"3*4=12; 12+2=14." },
  { id:3, q:"Which planet is the Red Planet?", choices:["Earth","Mars","Venus","Jupiter"], a:1, explain:"Mars looks red due to iron oxide." }
];

app.get('/api/health', (req,res) => res.json({ ok: true }));

app.get('/api/question', (req,res) => {
  const q = QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];
  res.json({ id: q.id, q: q.q, choices: q.choices });
});

app.post('/api/check', (req,res) => {
  const { id, choice } = req.body || {};
  const q = QUESTIONS.find(x => x.id === id);
  if (!q) return res.status(400).json({ error: 'invalid id' });
  res.json({ correct: q.a === choice });
});

app.get('/api/explain/:id', (req,res) => {
  const q = QUESTIONS.find(x => x.id === Number(req.params.id));
  if (!q) return res.status(400).json({ error: 'invalid id' });
  res.json({ explanation: q.explain });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('EduFlash backend running on', port));
