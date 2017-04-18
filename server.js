const express = require("express");
const app = express();
const path = require("path");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
var Bing = require('node-bing-api')({accKey:process.env.BING_API_KEY});
const port = process.env.PORT || 3000;
const mLabUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/images";

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.resolve(__dirname,'public')));
var searches = null;

MongoClient.connect(mLabUrl,(err,db)=>{
    if(err){
        console.log('Mongodb server connection failed');
    }else{
        console.log('Mongodb Server connected successfully');
        searches = db.collection('searches');
    }    
});


app.get('/',(req,res)=>{
   res.render('index'); 
});


app.get('/api/imagesearch/:searchQuery',(req,res)=>{
    var seacrh = decodeURIComponent(req.params.searchQuery);
    var when = new Date();
    var offset = req.query.offset || 10;
    var skip = req.query.skip || 0;
    searches.insert({searched:seacrh,when:when});
    
    Bing.images(seacrh,{top:offset,skip:skip},(err,response,body)=>{
        if(err){
            console.error(err);
            return res.send(err.message);
        }
       
         res.json(body.value.map((el)=>{
            return{
                alt:el.name,
                page:el.hostPageUrl,
                image:el.contentUrl
            }
         }));
        
    });
    
});


app.get('/api/latest/imagesearch/',(req,res)=>{
    
    searches.find().limit(10).sort({when:-1}).toArray((err,results)=>{
        if(err){
            console.error(err);
			return res.status(500).end(err.message);
        }
        res.json(results.map((doc)=>{
            return {
                term:doc.searched,
                when:doc.when
                };
        }));
    })
});

app.listen(port,()=>{
    console.log('Server running on port',port);
})