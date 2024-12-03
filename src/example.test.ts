import {Entity, MikroORM, PrimaryKey, Property, types} from '@mikro-orm/sqlite';

interface addressType {street:string|null, zip:string|null}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Property({fieldName: 'address', type: types.json, nullable: false})
  address: addressType | null;

  constructor(name: string, email: string, address: addressType) {
    this.name = name;
    this.email = email;
    this.address = address;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo', address: {zip:null, street: null} });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user.name).toBe('Foo');
  user.name = 'Bar';
  user.address = {zip:null, street: null}; // <-- with postgres I see an update for the column
  await orm.em.flush();

  expect(user.email).toBe('foo');
  expect(user.name).toBe('Bar');
});
