module Api
  module V1
    class SessionsController < ApplicationController
      # POST /api/v1/login
      def create
        user = User.find_by(email: params[:email])

        if user && user.authenticate(params[:password])
          token = encode_token({ user_id: user.id, exp: 24.hours.from_now.to_i })
          render json: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            token: token
          }, status: :ok
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end
    end
  end
end
