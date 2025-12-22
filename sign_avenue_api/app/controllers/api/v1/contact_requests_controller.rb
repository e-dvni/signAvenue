module Api
  module V1
    class ContactRequestsController < ApplicationController
      # POST /api/v1/contact_requests
      def create
        contact = ContactRequest.new(contact_params)

        if contact.save
          render json: { message: "Contact request received", contact: contact }, status: :created
        else
          render json: { errors: contact.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def contact_params
        params.require(:contact_request).permit(
          :name,
          :email,
          :phone,
          :business_name,
          :city,
          :message,
          :file
        )
      end
    end
  end
end
