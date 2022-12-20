const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();


mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://irakli9823:lqdzVA6ZOUped0HA@cluster0.uafysts.mongodb.net/todolistDB", 
{useNewUrlParser: true, useUnifiedTopology: true})
// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB',{useNewUrlParser: true, 
// useUnifiedTopology: true })

.then(() => {
    console.log(`CONNECTED TO MONGO!`);
})
.catch((err) => {
    console.log(`OH NO! MONGO CONNECTION ERROR!`);
    console.log(err);
});

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const buyFood = new Item({
    name: "Buy Food"
});

const cookFood = new Item({
    name: "Cook Food"
});

const eatFood = new Item({
    name: "Eat Food"
});

const defaultItems = [buyFood, cookFood, eatFood];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.get("/", function(req, res){

    Item.find((err, items) => {

        if(items.length === 0){
            
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                } else {
                    console.log("Succesfully saved default items to todolistDB");
                }
            });
            res.redirect("/");

        } else {
            res.render("list", {
            listTitle: "Today",
            newListItems: items
            });
        }

    });

});


app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //Create a new list
                const newList = new List({
                    name: customListName,
                    items: defaultItems
                });
                newList.save();
                res.redirect("/" + customListName);

            } else {
                //Show existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });

});



app.post("/", function(req, res){
    
    const itemName = req.body.newItem;
    const listName = req.body.listItem;

    const newItem = new Item({
        name: itemName
    });

    if(listName === "Today"){
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if(!err){
                console.log("Succesfully Deleted Checked Item");
                res.redirect("/");
            }
        })
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, 
        function(err, foundLIst){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
});


app.listen(3000, () => {
    console.log("Server started on port 3000");
})