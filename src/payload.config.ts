// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { index, integer } from '@payloadcms/db-postgres/drizzle/pg-core'


import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, {
    slug: 'places',
    fields: [
      {
        name: 'country',
        type: 'text',
      },
      {
        name: 'city',
        type: 'text',
      },
    ],
  },],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    afterSchemaInit: [
      ({ schema, extendTable, adapter }) => {
        extendTable({
          table: schema.tables.places,
          columns: {
            extraIntegerColumn: integer('extra_integer_column'),
          },
          extraConfig: (table) => ({
            country_city_composite_index: index('country_city_composite_index').on(
              table.country,
              table.city,
            ),
          }),
        })
        return schema
      },
    ],
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
