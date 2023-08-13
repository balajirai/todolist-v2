require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { connectDB } = require("./connectDB");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connecting to database
connectDB();

// schema 
const itemSchema = {
  name: String
};

// model
const Item = mongoose.model("Item", itemSchema);

// mongoose documents
const item1 = new Item({
  name: "Welcome to todolist!"
});

// array of items (which we'll insert further in Item collection)
const defaultItems = [item1];

// creating list schema 
const listSchema = {
  name: String,
  items: [itemSchema]
}

// creating mongoose model for list
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  // find method
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        // inserting the items in the Item collection
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved defult items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      }
      else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

});

// accepting post request for /delete route
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log("Successfully Deleted from", listName);
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(function () {
        console.log("Successfully Deleted from", listName);
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

});

// for creating custom "to do" list 
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        // show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});