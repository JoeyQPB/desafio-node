import express from "express";
import puppeteer from "puppeteer";
import * as fs from "node:fs";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json" assert { type: "json" };
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

let inMemoryRepository = [];

async function getAllLenovoNotebooks() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(
      "https://webscraper.io/test-sites/e-commerce/allinone/computers/laptops"
    );

    const arrayDeNotebooksLenovo = await page.evaluate(() => {
      const nodeList = document.querySelectorAll(".container.test-site");
      const allNotebooks = [
        ...nodeList[0].children[0].children[1].children[1].children,
      ];

      const allNotebooksLenovo = [];

      for (let i = 0; i < allNotebooks.length; i++) {
        if (
          allNotebooks[i].children[0].children[1].children[1].children[0].title
            .toLowerCase()
            .includes(`lenovo`)
        ) {
          allNotebooksLenovo.push(allNotebooks[i]);
        }
      }

      const objtsNotebooksLenovo = [];

      for (let i = 0; i < allNotebooksLenovo.length; i++) {
        const obj = {
          id: self.crypto.randomUUID(),
          title: "",
          srcImg: "",
          price: 0,
          description: {
            screenResolution: "",
            processor: "",
            memory: "",
            hardDrive: "",
            operatingSystem: "",
          },
        };

        obj.title =
          allNotebooksLenovo[
            i
          ].children[0].children[1].children[1].children[0].title;

        obj.srcImg = allNotebooksLenovo[i].children[0].children[0].src;

        obj.price = Number(
          allNotebooksLenovo[
            i
          ].children[0].children[1].children[0].innerText.slice(1)
        );

        const descriptionArraySplit =
          allNotebooksLenovo[0].children[0].children[1].children[2].innerText.split(
            ","
          );

        obj.description.screenResolution = descriptionArraySplit[1]
          .replace(/[\\]/g, "")
          .replace(" ", "");
        obj.description.processor = descriptionArraySplit[2].replace(" ", "");
        obj.description.memory = descriptionArraySplit[3].replace(" ", "");
        obj.description.hardDrive = descriptionArraySplit[4].replace(" ", "");
        obj.description.operatingSystem = descriptionArraySplit[5].replace(
          " ",
          ""
        );

        objtsNotebooksLenovo.push(obj);
      }

      objtsNotebooksLenovo.sort((a, b) => a - b);

      return objtsNotebooksLenovo;
    });

    inMemoryRepository.push(...arrayDeNotebooksLenovo);

    await browser.close();

    console.log("OK!");
  } catch (err) {
    console.log(err);
  }
}

getAllLenovoNotebooks();

app.get("/all_notebooks", (req, res) => {
  res.status(200).json(inMemoryRepository);
});

app.get("/notebook/:id", (req, res) => {
  const { id } = req.params;
  const notebook = inMemoryRepository.filter((el) => el.id === id);

  if (notebook) {
    res.status(200).json(notebook);
  } else {
    res.status(404).json({ message: `Item with id ${id} not found` });
  }
});

app.post("/create_notebook", (req, res) => {
  const newNotebook = { ...req.body, id: uuidv4() };
  inMemoryRepository.push(newNotebook);

  res.status(201).json(newNotebook);
});

app.patch("/edit_notebook/:id", (req, res) => {
  const { id } = req.params;
  const notebookEdited = { ...req.body, id: id };
  if (notebookEdited) {
    inMemoryRepository.map((el) => {
      if (el.id === id) {
        // el = [{ ...notebookEdited }];
        if (notebookEdited.title) el.title = notebookEdited.title;
        if (notebookEdited.srcImg) el.srcImg = notebookEdited.srcImg;
        if (notebookEdited.price) el.price = notebookEdited.price;
        if (notebookEdited.description) {
          if (notebookEdited.description.screenResolution) {
            el.description.notebookEdited =
              notebookEdited.description.screenResolution;
          }
          if (notebookEdited.description.processor) {
            el.description.processor = notebookEdited.description.processor;
          }
          if (notebookEdited.description.memory) {
            el.description.memory = notebookEdited.description.memory;
          }
          if (notebookEdited.description.hardDrive) {
            el.description.hardDrive = notebookEdited.description.hardDrive;
          }
          if (notebookEdited.description.operatingSystem) {
            el.description.operatingSystem =
              notebookEdited.description.operatingSystem;
          }
        }
      }
    });
    res.status(200).json(notebookEdited);
  } else {
    res.status(404).json({ message: `Item with id ${id} not found` });
  }
});

app.put("/edit_allNotebook/:id", (req, res) => {
  const { id } = req.params;
  const notebookEdited = { ...req.body, id: id };
  if (notebookEdited) {
    inMemoryRepository.map((el) => {
      if (el.id === id) {
        // el = [{ ...notebookEdited }];
        el.title = notebookEdited.title;
        el.srcImg = notebookEdited.srcImg;
        el.price = notebookEdited.price;
        el.description.notebookEdited =
          notebookEdited.description.screenResolution;
        el.description.processor = notebookEdited.description.processor;
        el.description.memory = notebookEdited.description.memory;
        el.description.hardDrive = notebookEdited.description.hardDrive;
        el.description.operatingSystem =
          notebookEdited.description.operatingSystem;
      }
    });
    res.status(200).json(notebookEdited);
  } else {
    res.status(404).json({ message: `Item with id ${id} not found` });
  }
});

app.delete("/delete_notebook/:id", (req, res) => {
  const { id } = req.params;
  inMemoryRepository.filter((el) => el.id === id);
  const cleanArray = inMemoryRepository.filter((el) => el.id !== id);

  if (cleanArray.length === inMemoryRepository.length) {
    res.status(404).json({ message: `Item with id ${id} not found` });
  }

  inMemoryRepository = cleanArray;
  res.status(200).json({ msg: `Item removido` });
});

app.get("/json_file", async (req, res) => {
  try {
    inMemoryRepository.sort((a, b) => a.price - b.price);
    fs.writeFile(
      "notebooks.json",
      JSON.stringify(inMemoryRepository, null, 2),
      (err) => {
        if (err) throw new Error("Something went wrong");

        console.log("Well done!!");
      }
    );

    const data = fs.readFile("./notebooks.json", "utf8", function (err, data) {
      console.log(data);
    });
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerDocument));

app.listen(8080, () => {
  console.log(`Server up at port: 8080!!`);
});
