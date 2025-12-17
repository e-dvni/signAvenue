module Api
  module V1
    module Admin
      class ContactRequestsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!

        # GET /api/v1/admin/contact_requests
        class Api::V1::Admin::ContactRequestsController < ApplicationController
            include Rails.application.routes.url_helpers

            def index
                requests = ContactRequest.order(created_at: :desc)

                render json: requests.map { |cr|
                    cr.as_json.merge(
                        file_url: cr.file.attached? ? url_for(cr.file) : nil
                    )
                }, status: :ok
            end
        end

        # GET /api/v1/admin/contact_requests/:id
        def show
          contact_request = ContactRequest.find_by(id: params[:id])

          if contact_request
            render json: contact_request.as_json, status: :ok
          else
            render json: { error: "Contact request not found" }, status: :not_found
          end
        end

        # PATCH/PUT /api/v1/admin/contact_requests/:id
        # e.g. update status or internal notes later
        def update
          contact_request = ContactRequest.find_by(id: params[:id])

          unless contact_request
            return render json: { error: "Contact request not found" }, status: :not_found
          end

          if contact_request.update(contact_request_params)
            render json: contact_request.as_json, status: :ok
          else
            render json: { errors: contact_request.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def contact_request_params
          # You can add :status, :internal_notes etc. when you add those columns
          params.require(:contact_request).permit(:status)
        end
      end
    end
  end
end
