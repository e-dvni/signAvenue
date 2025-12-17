module Api
  module V1
    class UsersController < ApplicationController
      # POST /api/v1/users
      # Signup
      def create
        user = User.new(user_params)

        if user.save
          token = encode_token({ user_id: user.id, exp: 24.hours.from_now.to_i })
          render json: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            token: token
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/me
      def me
        if current_user
          render json: {
            id: current_user.id,
            name: current_user.name,
            email: current_user.email,
            role: current_user.role
          }, status: :ok
        else
          render json: { error: "Not authorized" }, status: :unauthorized
        end
      end

      private

      def user_params
        params.require(:user).permit(:name, :email, :password, :password_confirmation, :role)
      end
    end
  end
end
