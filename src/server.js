import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import session from 'express-session'
import helmet from 'helmet'
import morgan from 'morgan'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { router } from './routes/index-router.js'

/**
 * Entry point of the application.
 */
const main = async () => {
  const port = process.env.PORT || 5000
  const directoryFullName = dirname(fileURLToPath(import.meta.url))

  const server = express()

  server.use(morgan('dev'))
  server.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            'cdn.jsdelivr.net'
          ],
          'img-src': ["'self'", 'gitlab.lnu.se', '*.gravatar.com']
        }
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false
    })
  )

  server.set('view engine', 'ejs')
  server.set('views', join(directoryFullName, 'views'))
  server.use(expressLayouts)
  server.set('layout', join(directoryFullName, 'views', 'layouts', 'default'))
  server.use(express.static(join(directoryFullName, '..', 'public')))

  server.use(express.urlencoded({ extended: false }))

  const nodeEnv = process.env.NODE_ENV
  server.set('trust proxy', 1)
  server.use(
    session({
      name: process.env.SESSION_NAME,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: nodeEnv !== 'development',
        maxAge: 60 * 60 * 1000 * 2,
        sameSite: 'Lax'
      }
    })
  )

  server.use('/', router)

  server.use((err, req, res, next) => {
    const viewData = {
      err: {
        status: err.status || 500,
        message: err.message
      }
    }
    res.render('errors/error', { viewData })
  })

  server.listen(port, () => {
    console.info(`Server running at http://localhost:${port}`)
  })
}

try {
  main()
} catch (err) {
  console.error(err.message)
}
