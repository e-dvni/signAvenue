Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Contact form submissions
      resources :contact_requests, only: [:create]

      # User Accounts (signup)
      resources :users, only: [:create]

      # Login
      post "login", to: "sessions#create"

      # Authenticated user info
      get "me", to: "users#me"

      # Customer projects
      resources :projects, only: [:index, :show, :update] do
        resources :files, controller: "project_files", only: [:index, :show]
      end

      # Customer schedule view (read-only availability)
      get "schedule", to: "schedule#index"

      # Admin namespace
      namespace :admin do
        resources :contact_requests, only: [:index, :show, :update]

        resources :projects, only: [:index, :show, :update] do
          resources :files, controller: "project_files", only: [:index, :show, :create, :destroy]
        end

        # Installation schedule overview
        get "schedule", to: "schedule#index"
      end
    end
  end
end
