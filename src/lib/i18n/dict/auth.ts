import type { Dictionary } from '../index';

/** Client sign-in flow: /login page, AuthForm, AuthModal and the header user button. */
export const auth: Dictionary = {
  en: {
    // Page chrome
    'auth.backHome': 'Back to KHB Home',
    'auth.portalBadge': 'KHB Events Portal',
    'auth.welcomePrefix': 'Welcome to',
    'auth.welcomeBrand': 'KHB EVENTS',
    'auth.subtitle': 'Access your bookings, event passes, inquiries, and VIP services.',
    'auth.footer': 'By continuing, you agree to KHB EVENTS Terms of Service and Privacy Policy.',

    // Tabs
    'auth.tabGoogle': 'Google',
    'auth.tabEmail': 'Email',
    'auth.tabPhone': 'Phone',

    // Google
    'auth.googleHint': 'Sign in with your Google account for instantaneous 1-click access with no password required.',
    'auth.googleButton': 'Continue with Google',

    // Email
    'auth.emailSignInHint': 'Sign In to existing account',
    'auth.emailSignUpHint': 'Create a new client account',
    'auth.needAccount': 'Need an account? Sign Up',
    'auth.alreadyRegistered': 'Already registered? Sign In',
    'auth.fullName': 'Full Name',
    'auth.emailAddress': 'Email Address',
    'auth.password': 'Password',
    'auth.phoneOptional': 'Phone Number (Optional)',
    'auth.signInWithEmail': 'Sign In with Email',
    'auth.createAccount': 'Create Account',

    // Phone / OTP
    'auth.phoneHint': 'Enter your mobile number to receive a one-time SMS verification code. Supports Cambodian (+855) and international numbers.',
    'auth.mobilePhone': 'Mobile Phone',
    'auth.phonePlaceholder': '012 888 999 or +855 12 888 999',
    'auth.sendSmsCode': 'Send SMS Code',
    'auth.codeSentTo': 'Code sent to',
    'auth.change': 'Change',
    'auth.sixDigitCode': '6-Digit Code',
    'auth.verifyAndSignIn': 'Verify & Sign In',

    // Success messages
    'auth.successSignedIn': 'Successfully signed in!',
    'auth.successCreatedSignedIn': 'Account created and signed in successfully!',
    'auth.successCreatedSignIn': 'Account created successfully! Please sign in with your password.',
    'auth.successSmsSent': 'SMS verification code sent to {phone}',
    'auth.successPhoneVerified': 'Phone verified successfully!',

    // Error messages
    'auth.errGoogle': 'Failed to sign in with Google',
    'auth.errFullName': 'Please enter your full name',
    'auth.errAuthFailed': 'Authentication failed',
    'auth.errPhoneInvalid': 'Please enter a valid phone number',
    'auth.errSmsFailed': 'Failed to send SMS code',
    'auth.errCodeRequired': 'Please enter the 6-digit code',
    'auth.errCodeInvalid': 'Invalid or expired verification code',
    'auth.errInvalidCredentials': 'Invalid email or password.',
    'auth.errEmailNotConfirmed': 'Please confirm your email address before signing in.',
    'auth.errAlreadyRegistered': 'This email is already registered. Please sign in.',
    'auth.errPasswordShort': 'Password should be at least 6 characters.',
    'auth.errRateLimit': 'Too many attempts. Please wait a moment and try again.',

    // Modal
    'auth.close': 'Close',

    // User nav button
    'auth.signIn': 'Sign In',
    'auth.signOut': 'Sign Out',
    'auth.client': 'Client',
    'auth.roleOwner': 'OWNER',
    'auth.roleSuperAdmin': 'SUPER ADMIN',
    'auth.roleStaff': 'KHB STAFF',
    'auth.signedInVia': 'Signed in via {provider}',
    'auth.adminPortal': 'Admin & Leads CRM Portal',
  },
  kh: {
    'auth.backHome': 'ត្រឡប់ទៅទំព័រដើម KHB',
    'auth.portalBadge': 'ផតថល KHB Events',
    'auth.welcomePrefix': 'សូមស្វាគមន៍មកកាន់',
    'auth.welcomeBrand': 'KHB EVENTS',
    'auth.subtitle': 'ចូលមើលការកក់ សំបុត្រព្រឹត្តិការណ៍ ការសាកសួរ និងសេវា VIP របស់លោកអ្នក។',
    'auth.footer': 'ការបន្ត មានន័យថាលោកអ្នកយល់ព្រមតាមលក្ខខណ្ឌសេវា និងគោលការណ៍ឯកជនភាពរបស់ KHB EVENTS។',

    'auth.tabGoogle': 'Google',
    'auth.tabEmail': 'អ៊ីមែល',
    'auth.tabPhone': 'ទូរស័ព្ទ',

    'auth.googleHint': 'ចូលដោយគណនី Google ដើម្បីចូលភ្លាមៗ ដោយមិនចាំបាច់ពាក្យសម្ងាត់។',
    'auth.googleButton': 'បន្តជាមួយ Google',

    'auth.emailSignInHint': 'ចូលគណនីដែលមានស្រាប់',
    'auth.emailSignUpHint': 'បង្កើតគណនីអតិថិជនថ្មី',
    'auth.needAccount': 'មិនទាន់មានគណនី? ចុះឈ្មោះ',
    'auth.alreadyRegistered': 'មានគណនីហើយ? ចូល',
    'auth.fullName': 'ឈ្មោះពេញ',
    'auth.emailAddress': 'អាសយដ្ឋានអ៊ីមែល',
    'auth.password': 'ពាក្យសម្ងាត់',
    'auth.phoneOptional': 'លេខទូរស័ព្ទ (ជម្រើស)',
    'auth.signInWithEmail': 'ចូលដោយអ៊ីមែល',
    'auth.createAccount': 'បង្កើតគណនី',

    'auth.phoneHint': 'បញ្ចូលលេខទូរស័ព្ទ ដើម្បីទទួលកូដផ្ទៀងផ្ទាត់តាម SMS។ គាំទ្រលេខកម្ពុជា (+855) និងអន្តរជាតិ។',
    'auth.mobilePhone': 'លេខទូរស័ព្ទ',
    'auth.phonePlaceholder': '012 888 999 ឬ +855 12 888 999',
    'auth.sendSmsCode': 'ផ្ញើកូដ SMS',
    'auth.codeSentTo': 'កូដបានផ្ញើទៅ',
    'auth.change': 'ប្តូរ',
    'auth.sixDigitCode': 'កូដ 6 ខ្ទង់',
    'auth.verifyAndSignIn': 'ផ្ទៀងផ្ទាត់ និងចូល',

    'auth.successSignedIn': 'ចូលបានជោគជ័យ!',
    'auth.successCreatedSignedIn': 'បង្កើតគណនី និងចូលបានជោគជ័យ!',
    'auth.successCreatedSignIn': 'បង្កើតគណនីបានជោគជ័យ! សូមចូលដោយពាក្យសម្ងាត់របស់លោកអ្នក។',
    'auth.successSmsSent': 'កូដផ្ទៀងផ្ទាត់ SMS បានផ្ញើទៅ {phone}',
    'auth.successPhoneVerified': 'ផ្ទៀងផ្ទាត់លេខទូរស័ព្ទបានជោគជ័យ!',

    'auth.errGoogle': 'ចូលដោយ Google មិនបាន',
    'auth.errFullName': 'សូមបញ្ចូលឈ្មោះពេញរបស់លោកអ្នក',
    'auth.errAuthFailed': 'ការផ្ទៀងផ្ទាត់បរាជ័យ',
    'auth.errPhoneInvalid': 'សូមបញ្ចូលលេខទូរស័ព្ទឱ្យត្រឹមត្រូវ',
    'auth.errSmsFailed': 'ផ្ញើកូដ SMS មិនបាន',
    'auth.errCodeRequired': 'សូមបញ្ចូលកូដ 6 ខ្ទង់',
    'auth.errCodeInvalid': 'កូដផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវ ឬផុតកំណត់',
    'auth.errInvalidCredentials': 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។',
    'auth.errEmailNotConfirmed': 'សូមបញ្ជាក់អ៊ីមែលរបស់លោកអ្នកមុនពេលចូល។',
    'auth.errAlreadyRegistered': 'អ៊ីមែលនេះបានចុះឈ្មោះរួចហើយ។ សូមចូល។',
    'auth.errPasswordShort': 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួ។',
    'auth.errRateLimit': 'ព្យាយាមច្រើនដងពេក។ សូមរង់ចាំបន្តិច រួចព្យាយាមម្តងទៀត។',

    'auth.close': 'បិទ',

    'auth.signIn': 'ចូល',
    'auth.signOut': 'ចាកចេញ',
    'auth.client': 'អតិថិជន',
    'auth.roleOwner': 'ម្ចាស់',
    'auth.roleSuperAdmin': 'អ្នកគ្រប់គ្រងកំពូល',
    'auth.roleStaff': 'បុគ្គលិក KHB',
    'auth.signedInVia': 'បានចូលតាម {provider}',
    'auth.adminPortal': 'ផតថលអ្នកគ្រប់គ្រង និង CRM',
  },
};
