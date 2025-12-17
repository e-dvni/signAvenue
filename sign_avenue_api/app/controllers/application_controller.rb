class ApplicationController < ActionController::API
  include ActionController::Cookies if defined?(ActionController::Cookies)

  private

  def jwt_secret_key
    Rails.application.secret_key_base
  end

  def encode_token(payload)
    JWT.encode(payload, jwt_secret_key, "HS256")
  end

  def decoded_token
    auth_header = request.headers["Authorization"]
    return nil unless auth_header

    # Expecting header like: "Bearer <token>"
    token = auth_header.split(" ").last

    begin
      JWT.decode(token, jwt_secret_key, true, { algorithm: "HS256" })
    rescue JWT::DecodeError
      nil
    end
  end

  def current_user
    return @current_user if defined?(@current_user)

    if decoded_token
      user_id = decoded_token[0]["user_id"]
      @current_user = User.find_by(id: user_id)
    else
      @current_user = nil
    end
  end

  def authenticate_user!
    render json: { error: "Not authorized" }, status: :unauthorized unless current_user
  end

  def require_admin!
    unless current_user&.role == "admin"
      render json: { error: "Admin only" }, status: :forbidden
    end
  end
end
