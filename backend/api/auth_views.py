"""Authentication views: signup, login, OTP, Google callback."""

import json
import random
import string

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# In-memory OTP store (replace with Redis/DB in production)
_otp_store: dict[str, dict] = {}


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _json_body(request):
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Send OTP
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def send_otp(request):
    body = _json_body(request)
    if not body or not body.get("email"):
        return JsonResponse({"error": "ایمیل الزامی است"}, status=400)

    email = body["email"].strip().lower()
    otp = _generate_otp()
    _otp_store[email] = {"otp": otp, "data": body}

    # In production: send email via SMTP
    # In dev: prints to console (EMAIL_BACKEND=console)
    try:
        from django.core.mail import send_mail
        send_mail(
            subject="کد تأیید Dlea AI",
            message=f"کد تأیید شما: {otp}\n\nاین کد تا ۵ دقیقه معتبر است.",
            from_email=None,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception:
        pass  # If email fails, still return debug_otp

    print(f"\n{'='*40}\n  OTP for {email}: {otp}\n{'='*40}\n")

    from django.conf import settings
    resp = {"message": f"کد تأیید به {email} ارسال شد"}
    if settings.DEBUG:
        resp["debug_otp"] = otp
    return JsonResponse(resp)


# ---------------------------------------------------------------------------
# Verify OTP + Register
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def verify_otp_register(request):
    body = _json_body(request)
    if not body:
        return JsonResponse({"error": "داده نامعتبر"}, status=400)

    email = body.get("email", "").strip().lower()
    otp = body.get("otp", "").strip()
    first_name = body.get("firstName", "").strip()
    last_name = body.get("lastName", "").strip()
    password = body.get("password", "")

    if not all([email, otp, first_name, last_name, password]):
        return JsonResponse({"error": "همه فیلدها الزامی هستند"}, status=400)

    stored = _otp_store.get(email)
    if not stored or stored["otp"] != otp:
        return JsonResponse({"error": "کد تأیید نادرست است"}, status=400)

    # Check if user already exists
    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "ایمیل قبلاً ثبت شده است"}, status=400)

    # Create user
    username = email.split("@")[0]
    # Ensure unique username
    base = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    # Clean up OTP
    _otp_store.pop(email, None)

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    return JsonResponse({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
        },
    }, status=201)


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    body = _json_body(request)
    if not body:
        return JsonResponse({"error": "داده نامعتبر"}, status=400)

    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return JsonResponse({"error": "ایمیل و رمز عبور الزامی است"}, status=400)

    # Find user by email
    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "کاربری با این ایمیل یافت نشد"}, status=401)

    user = authenticate(username=user_obj.username, password=password)
    if user is None:
        return JsonResponse({"error": "رمز عبور نادرست است"}, status=401)

    refresh = RefreshToken.for_user(user)

    from api.views import _compute_auto_role, _effective_role
    from api.models import UserProfile
    auto_role = _compute_auto_role(user)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    effective = _effective_role(auto_role, profile.role)

    return JsonResponse({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
        },
        "role": effective,
    })


# ---------------------------------------------------------------------------
# Password Reset — Step 1: Send reset OTP
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def password_reset_request(request):
    body = _json_body(request)
    if not body or not body.get("email"):
        return JsonResponse({"error": "ایمیل الزامی است"}, status=400)

    email = body["email"].strip().lower()

    # Check if user exists (but don't reveal this — same message either way)
    try:
        User.objects.get(email=email)
    except User.DoesNotExist:
        # Still return success to prevent email enumeration
        return JsonResponse({"message": f"کد تأیید به {email} ارسال شد"})

    otp = _generate_otp()
    _otp_store[email] = {"otp": otp, "type": "password_reset"}

    try:
        from django.core.mail import send_mail
        send_mail(
            subject="بازیابی رمز عبور — Dlea AI",
            message=f"کد بازیابی رمز عبور شما: {otp}\n\nاین کد تا ۵ دقیقه معتبر است.",
            from_email=None,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception:
        pass

    print(f"\n{'='*40}\n  Password Reset OTP for {email}: {otp}\n{'='*40}")

    from django.conf import settings as _s
    resp = {"message": f"کد تأیید به {email} ارسال شد"}
    if _s.DEBUG:
        resp["debug_otp"] = otp
    return JsonResponse(resp)


# ---------------------------------------------------------------------------
# Password Reset — Step 2: Verify OTP
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def password_reset_verify(request):
    body = _json_body(request)
    if not body:
        return JsonResponse({"error": "داده نامعتبر"}, status=400)

    email = body.get("email", "").strip().lower()
    code = body.get("code", "").strip()

    if not email or not code:
        return JsonResponse({"error": "ایمیل و کد تایید الزامی است"}, status=400)

    stored = _otp_store.get(email)
    if not stored or stored["otp"] != code or stored.get("type") != "password_reset":
        return JsonResponse({"error": "کد تایید نادرست یا منقضی شده است"}, status=400)

    return JsonResponse({"message": "کد تایید شد"})


# ---------------------------------------------------------------------------
# Password Reset — Step 3: Set new password
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def password_reset_confirm(request):
    body = _json_body(request)
    if not body:
        return JsonResponse({"error": "داده نامعتبر"}, status=400)

    email = body.get("email", "").strip().lower()
    code = body.get("code", "").strip()
    password = body.get("password", "")

    if not all([email, code, password]):
        return JsonResponse({"error": "همه فیلدها الزامی هستند"}, status=400)

    if len(password) < 8:
        return JsonResponse({"error": "رمز عبور باید حداقل ۸ کاراکتر باشد"}, status=400)

    stored = _otp_store.get(email)
    if not stored or stored["otp"] != code or stored.get("type") != "password_reset":
        return JsonResponse({"error": "کد تایید نادرست یا منقضی شده است"}, status=400)

    # Find user and update password
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "کاربری با این ایمیل یافت نشد"}, status=404)

    user.set_password(password)
    user.save()

    # Clean up OTP
    _otp_store.pop(email, None)

    return JsonResponse({"message": "رمز عبور با موفقیت تغییر کرد"})


# ---------------------------------------------------------------------------
# Google OAuth callback (Google Identity Services credential)
# ---------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def google_callback(request):
    """Handle Google Identity Services credential (JWT from Google One Tap).

    The frontend sends the `credential` (a Google-issued JWT) after the user
    completes the Google sign-in popup.  We decode it to extract email/name
    and create or log in the user.

    For production, verify the JWT signature with Google's public keys.
    For dev, we decode the JWT payload without verification (base64).
    """
    body = _json_body(request)
    if not body:
        return JsonResponse({"error": "داده نامعتبر"}, status=400)

    credential = body.get("credential", "")
    if not credential:
        return JsonResponse({"error": "توکن گوگل دریافت نشد"}, status=400)

    # Decode the Google JWT payload (segment 1)
    try:
        import base64
        payload_segment = credential.split(".")[1]
        # Add padding
        padding = 4 - len(payload_segment) % 4
        if padding != 4:
            payload_segment += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(payload_segment)
        payload = json.loads(payload_bytes)
    except Exception:
        return JsonResponse({"error": "توکن گوگل نامعتبر است"}, status=400)

    google_email = payload.get("email", "").strip().lower()
    google_name = payload.get("name", "")
    google_picture = payload.get("picture", "")
    google_sub = payload.get("sub", "")  # Google user ID

    if not google_email:
        return JsonResponse({"error": "ایمیل گوگل دریافت نشد"}, status=400)

    # Split name
    parts = google_name.split(" ", 1) if google_name else [""]
    first_name = parts[0] if len(parts) > 0 else ""
    last_name = parts[1] if len(parts) > 1 else ""

    # Find or create user
    user, created = User.objects.get_or_create(
        email=google_email,
        defaults={
            "username": google_email.split("@")[0],
            "first_name": first_name,
            "last_name": last_name,
        },
    )

    if created:
        user.set_unusable_password()
        user.save()

    from api.views import _compute_auto_role, _effective_role
    from api.models import UserProfile
    auto_role = _compute_auto_role(user)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    effective = _effective_role(auto_role, profile.role)

    refresh = RefreshToken.for_user(user)

    return JsonResponse({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
        },
        "role": effective,
    })
