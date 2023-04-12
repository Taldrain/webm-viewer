# webm-viewer

List webm from a folder and expose various routes

- `/random`: returns a random webm
- `/id`: returns the name of random webm
- `/[webm]`: returns a specific webm
- `/viewer`: client side viewer with quick refresh

### Usage

Update the file .env with the path of a folder with multiple webm.

Start the project:

```
deno task dev
```

This will watch the project directory and restart as necessary.
