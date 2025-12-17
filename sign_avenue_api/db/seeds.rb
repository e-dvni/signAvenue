# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end
# Find your existing user (signup you did earlier)
admin = User.find_or_create_by!(email: "admin@signavenue.com") do |u|
  u.name = "Sign Avenue Admin"
  u.password = "password123"
  u.password_confirmation = "password123"
  u.role = "admin"
end

puts "Admin user: #{admin.email} / password123"
