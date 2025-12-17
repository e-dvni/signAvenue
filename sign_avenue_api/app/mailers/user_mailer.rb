class UserMailer < ApplicationMailer
  def email_confirmation(user, code)
    @user = user
    @code = code
    mail(to: @user.email, subject: "Your Sign Avenue confirmation code")
  end
end
