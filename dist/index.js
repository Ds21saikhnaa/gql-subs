import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
let data = [
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
];
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
      users(ID: ID!): [User]!
    }

    type Mutation {
      createUser(userInput: UserInput): User!
      editUser(ID: ID!, userInput: UserInput): Boolean
    }
`;
const resolvers = {
    Query: {
        async user(_, { ID }) {
            for (let i = 0; i < data.length; i++)
                if (data[i].id == ID)
                    return data[i];
            return "bhgi";
        },
        async users(_, args, context) {
            return data;
        }
    },
    Mutation: {
        async createUser(_, { userInput }) {
            console.log(userInput);
            data.push(userInput);
            return data;
        },
        async editUser(_, { ID, userInput }) {
            const { name, age } = userInput;
            for (let i = 0; i < data.length; i++) {
                if (data[i].id == ID) {
                    data[i].name = name;
                    data[i].age = age;
                    return true;
                }
            }
            return false;
        }
    }
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
const { url } = await startStandaloneServer(server, {
    listen: { port: 3000 },
});
console.log(`🚀 Server ready at ${url}`);
