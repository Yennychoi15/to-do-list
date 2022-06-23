require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//Connect mongoose
mongoose.connect(process.env.SECRET)
//Set Schema then mongoose.model
const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);

//Insert default data into the mongoose.model -> 
//Default array
const item1 = new Item({
  name:"welcome to do list"
});

const item2 = new Item({
  name:"Hit the + button to add a new item"
}); 

const item3 = new Item({
  name:"<----Hit this to delete an item"
});
const defaultItems = [item1, item2, item3]

//Set List Schema then Mongoose.model 
const listSchema={
  name: String,
  items: [itemsSchema]
}
const List =mongoose.model("List", listSchema);


//If page is empty insert Default data and 
//render the page 
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
      if(err){
      console.log(err)
      }else{
      console.log("Successfully inserted!")
      }
    })
      res.redirect("/")
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

//When checkbox is on, delete data from DBcollection
app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox
  const listName = req.body.listName

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      if(!err){
        console.log("Successfully deleted checked item")
        res.redirect("/")
      }
    });
  }else{
    List.findOneAndUpdate({name:listName}, {$pull: {items:{_id:checkedItemID}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName)
      }
    })
  }
});

//Dynamic router and creat webpage for it
//Check the title and render page
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const titleName = req.body.list;

  const item = new Item({
    name : itemName
  });

  if (titleName === "Today"){
    item.save()
    res.redirect("/")
  }else{ 
    //as user customized the router, 
    //default items are saved
    // so I can find the name. 
    List.findOne({name:titleName}, function(err, foundItem){
       foundItem.items.push(item);
       foundItem.save();
       res.redirect("/" + titleName)
    })
  }
}); 

//Customized router
app.get("/:customListName", function(req, res){
const listName = _.capitalize(req.params.customListName)
List.findOne({name:listName}, function(err, foundListName){
  if (!err){
    if(!foundListName){
      //create new list
    const list = new List ({
      name:listName,
      items:defaultItems
    })
    list.save();
    res.redirect("/" + listName)
    }else{
      //show an existing list
    res.render("list",{listTitle: listName, newListItems: foundListName.items} )
    }
}
})
 

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
