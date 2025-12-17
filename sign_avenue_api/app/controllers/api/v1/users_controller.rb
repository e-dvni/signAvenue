module Api
  module V1
    class UsersController < ApplicationController
      # POST /api/v1/users
      # Signup (creates user, sends confirmation code)
      def create
        user = User.new(user_params)
        user.role = "customer" # never allow client to set role

        if user.save
          unless user.can_send_confirmation_code?
            return render json: {
              error: "Too many confirmation codes sent. Please wait and try again."
            }, status: :too_many_requests
          end

          code = user.generate_and_store_confirmation_code!

          Rails.logger.info("[DEV] Confirmation code for #{user.email}: #{code}") if Rails.env.development?

          # Send email (if mailer not configured yet, this may error)
          UserMailer.email_confirmation(user, code).deliver_now

          render json: {
            message: "Account created. Please verify your email.",
            needs_verification: true,
            email: user.email
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/users/verify-email
      # body: { email: "", code: "123456" }
      def verify_email
        email = params[:email].to_s.downcase.strip
        raw_code = params[:code].to_s.strip
        code = raw_code.gsub(/\s+/, "")

        # If it's digits and shorter than 6, left-pad with zeros (fixes numeric input issues)
        if code.match?(/\A\d+\z/) && code.length < 6
          code = code.rjust(6, "0")
        end

        user = User.find_by(email: email)
        return render json: { error: "User not found" }, status: :not_found unless user

        if user.email_confirmed?
          return render json: { message: "Email already confirmed" }, status: :ok
        end

        if user.verify_confirmation_code!(code)
          render json: { message: "Email confirmed. You can now log in." }, status: :ok
        else
          render json: { error: "Invalid or expired code" }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/users/resend-confirmation-code
      # body: { email: "" }
      def resend_confirmation_code
        email = params[:email].to_s.downcase.strip
        user = User.find_by(email: email)
        return render json: { error: "User not found" }, status: :not_found unless user

        if user.email_confirmed?
          return render json: { message: "Email already confirmed" }, status: :ok
        end

        unless user.can_send_confirmation_code?
          return render json: {
            error: "Too many confirmation codes sent. Please wait and try again."
          }, status: :too_many_requests
        end

        code = user.generate_and_store_confirmation_code!
        UserMailer.email_confirmation(user, code).deliver_now

        render json: { message: "Confirmation code sent." }, status: :ok
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
        # Allow first_name/last_name if your DB has them, plus name fallback.
        # Never permit role from the client.
        params.require(:user).permit(
          :email,
          :password,
          :password_confirmation,
          :first_name,
          :last_name,
          :name
        )
      end
    end
  end
end
