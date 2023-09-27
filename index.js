const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('This is RK-Store Server');
});

app.listen(port, () => {
    console.log(`RK-Store is running on port ${port}`);
});
