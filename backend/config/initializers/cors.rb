# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "https://stock-community-frontend.vercel.app"
    )

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      credentials: false
  end
end