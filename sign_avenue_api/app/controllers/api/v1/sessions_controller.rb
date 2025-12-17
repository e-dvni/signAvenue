module Api
  module V1
    class SessionsController < ApplicationController
      # POST /api/v1/login
      def create
        user = User.find_by(email: params[:email].to_s.downcase.strip)

        unless user && user.authenticate(params[:password])
          return render json: { error: "Invalid email or password" }, status: :unauthorized
        end

        if user.email_confirmed_at.nil?
          return render json: {
            error: "Email not confirmed",
            needs_verification: true,
            email: user.email
          }, status: :forbidden
        end

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
      end
    end
  end
end
