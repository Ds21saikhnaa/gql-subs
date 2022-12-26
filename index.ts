import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from 'express';
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from 'ws';
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from 'graphql-subscriptions';
import bodyParser from "body-parser";
import cors from "cors";

const pubsub = new PubSub();

interface user {
  id: string
  name: string
  age: number
}

let data: user[] = [
  {
    id: "1",
    name: "bat",
    age: 21
  },
  {
    id: "2",
    name: "bold",
    age: 21
  },
  {
    id: "3",
    name: "dulmaa",
    age: 21
  }
]

const typeDefs = `#graphql
    type User {
      name: String
      age: Int
    }
    input UserInput {
      name: String
      age: Int
      id: ID
    }

    type Query {
      user(ID: ID!): User!
      users(ID: ID!): Int!
    }

    type Mutation {
      createUser(userInput: UserInput): User!
      editUser(ID: ID!, userInput: UserInput): Boolean
    }

    type Subscription {
      change: Int
    }
`;



let currentNumber = 0;
const resolvers = {
  Subscription: {
    change: {
      subscribe: () => pubsub.asyncIterator(["CHANGE"])
    }
  },
  Query: {
    async user(_: any, { ID }: any) {
      for (let i = 0; i < data.length; i++) if(data[i].id == ID) return data[i];
      return "bhgi"
    },
    async users(_: any, args: any, { pubsub }: any) {
      return currentNumber
    }
  },
  Mutation: {
    async createUser(_: any, { userInput }: any) {
      console.log(userInput);
      data.push(userInput);
      return data;
    },
    async editUser(_: any, { ID, userInput }: any) {
      const { name, age } = userInput;
      for (let i = 0; i < data.length; i++){
        if (data[i].id == ID) {
          data[i].name = name;
          data[i].age = age;
          return true
        }
      }
      return false
    }
  }
};
const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  bodyParser.json(),
  expressMiddleware(server)
);

httpServer.listen(3000, () => {
  console.log(`🚀 Query endpoint ready at http://localhost:${3000}/graphql`);
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${3000}/graphql`
  );
});


function incrementNumber() {
  currentNumber += 1;
  pubsub.publish("CHANGE", { change: currentNumber });
  setTimeout(incrementNumber, 1000);
}
incrementNumber(); 
// const { url } = await startStandaloneServer(server , {
//   listen: { port: 3000 },
// });

// console.log(`🚀 Server ready at ${url}`);
