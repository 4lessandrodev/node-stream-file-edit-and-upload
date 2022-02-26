# File Upload - Node Stream

## Graphql file upload

- Using graphql-upload - createReadStream function.
- Crop and resize image using sharp.
- Create a copy to local folder.
- Upload edited file to aws s3.

### How to run this project
There are some linux commands on package.json.

First fill your .env with aws credentials.

```sh

$ cp ./.env.example ./.env

```

On linux feel free to run 

```sh

$ yarn install
$ yarn start

```

On windows better use dev

```sh

$ yarn install
$ yarn dev

```

