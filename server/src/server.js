const express = require('express');
const app = express();
const path = require('path')
const port = 3000;


app.use(express.static(path.join(__dirname, "../../public")));

app.get('/*', (req, res) => {
    console.log(__dirname, req.path);
    res.sendFile(path.join(__dirname, "../../public/index.html"));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});