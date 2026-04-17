import fs from "fs";
import path from "path";

async function getRandomImage(folderPath) {
    const files = await fs.promises.readdir(folderPath);

    const imageFiles = files.filter(file =>
        /\.(png|jpe?g|webp|avif)$/i.test(file)
    );

    if (imageFiles.length === 0) {
        throw new Error("");
    }

    const randomFile =
        imageFiles[Math.floor(Math.random() * imageFiles.length)];

    return path.join(folderPath, randomFile);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const first_names = ['Anna', 'Natali', 'Maria', 'Anastasia', 'Liza', 'Sasha'];
const last_names = ['Sergeivna', 'Volodymyrivna', 'Maxymivna'];
const surnames = ['Shevchenko', 'Kovalenko', 'Boiko', 'Polishchuk', 'Ivanenko'];

const n = 80;
for (let i=20;i<n;i++){
    const formData = new FormData();
    formData.append("username", `user${i}`);
    formData.append("email", `user${i}@gmail.com`);
    formData.append("password", "1234qweASD/1234");
    formData.append("first_name", first_names[Math.floor(Math.random() * first_names.length)]);
    formData.append("last_name", last_names[Math.floor(Math.random() * last_names.length)]);
    formData.append("surname", surnames[Math.floor(Math.random() * surnames.length)]);
    formData.append("birth_date", `200${randomInt(0, 6)}-0${randomInt(1, 9)}-${randomInt(1, 25)}`);
    formData.append("interests", String(randomInt(1, 5)));
    formData.append("interests", String(randomInt(6, 10)));
    formData.append("gender", "2");
    formData.append("looking_for", "1");
    formData.append("intention", String(randomInt(1, 4)));

    const file1Path = await getRandomImage("photos/");
    const file2Path = await getRandomImage("photos/");

    const file1 = await fs.promises.readFile(file1Path);
    const file2 = await fs.promises.readFile(file2Path);

    const file1Type = file1Path.match(/\.([^.]+)$/)[1];
    const file2Type = file2Path.match(/\.([^.]+)$/)[1];

    const blob1 = new Blob([file1], { type: `image/${file1Type}` });
    const blob2 = new Blob([file2], { type: `image/${file2Type}` });

    formData.append("photos", blob1, `image${i}_1.${file1Type}`);
    formData.append("photos", blob2, `image${i}_2.${file2Type}`);
    formData.append("longitude", `28.${randomInt(1, 9999)}`);
    formData.append("latitude", `50.${randomInt(1, 9999)}`);

    const data = await fetch(
        "http://127.0.0.1:8000/api/v1/user/register/",
        {
            method: 'POST',
            body: formData
        }
    );
    console.log(await data.json());
}


