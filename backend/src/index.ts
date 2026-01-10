import { AppDataSource } from './ormconfig';
import app from './app';

AppDataSource.initialize()
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
    console.log("NODE_ENV =", process.env.NODE_ENV);

  });
