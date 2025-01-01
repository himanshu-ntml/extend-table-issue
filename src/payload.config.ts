// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { BlocksFeature, EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { index, integer } from '@payloadcms/db-postgres/drizzle/pg-core'

import { v4 as uuidv4 } from 'uuid';


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
  editor: lexicalEditor({
    features: ({ defaultFeatures, }) => [
      ...defaultFeatures,
      EXPERIMENTAL_TableFeature(),
      BlocksFeature({
        blocks: [
          {
            slug: 'br',
            fields: [
              {
                name: 'id',
                type: 'text',
                defaultValue: uuid(),
                hooks: {
                  beforeValidate: [
                    async ({ value }) => {
                      console.log('value', value)
                      return value
                    }
                  ]
                },
                hidden: true,
              },
              {
                name: 'ignore',
                type: 'text',
              },
            ],
            interfaceName: 'BrBlock',
          },
        ],
        inlineBlocks: [
          {
            slug: 'inline-block',
            fields: [
              {
                name: 'id',
                type: 'text',
                defaultValue: uuidv4(),
                hidden: true,
              },
              {
                name: 'text',
                type: 'text',
              },
            ],
          },
        ]
      }),
    ],
  }),
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
