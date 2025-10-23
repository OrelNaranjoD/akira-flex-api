# [0.4.0](https://github.com/OrelNaranjoD/akira-flex-api/compare/v0.3.0...v0.4.0) (2025-10-16)


### Features

* **AFA-002 AFA-003:** implement refresh token ([2e0f200](https://github.com/OrelNaranjoD/akira-flex-api/commit/2e0f200b362ce0f04bccdf27c65d42ea905885fb))
* **AFA-017:** enhance user registration error handling and messages ([ca2c346](https://github.com/OrelNaranjoD/akira-flex-api/commit/ca2c34691aa007bd44664e368f635d246e0a3b49))
* **AFA-233:** enable SUPER_ADMIN to create tenant administrators ([3f73e4b](https://github.com/OrelNaranjoD/akira-flex-api/commit/3f73e4b441ae862e5da666b91d4b44d8cf7f61ce))
* **AFA-253 AFA-254:** add debug request and response interceptors for logging in development mode ([3fbbcf7](https://github.com/OrelNaranjoD/akira-flex-api/commit/3fbbcf7b4a4107830acc95dc835599991a38010b))
* **config:** update moduleNameMapper for shared module paths ([c9b0d34](https://github.com/OrelNaranjoD/akira-flex-api/commit/c9b0d34f73c3bce03f2c7d8fd13d5ef81ec58b37))
* **test:** update PlatformAuthService tests to include role repository and refresh token handling ([abec509](https://github.com/OrelNaranjoD/akira-flex-api/commit/abec509fd730d709377e93e5238fc85e3182e592))



# [0.3.0](https://github.com/OrelNaranjoD/akira-flex-api/compare/v0.2.0...v0.3.0) (2025-09-15)


### Bug Fixes

* add @Public decorator to platform guard ([d1b8664](https://github.com/OrelNaranjoD/akira-flex-api/commit/d1b8664e5c8ecc49fc5d88bbbc03c41f1f9c0817))
* **AFA-006:** add CORS configuration for local development ([7dc8c51](https://github.com/OrelNaranjoD/akira-flex-api/commit/7dc8c513af06dc674f2c95dcced818c620e36741))
* **ci:** install conventional commit parser ([4c942cb](https://github.com/OrelNaranjoD/akira-flex-api/commit/4c942cbdaf2b134928e9f6306f9360ea72286691))
* **env:** update SMTP host to example.com for correct email configuration ([8d9d986](https://github.com/OrelNaranjoD/akira-flex-api/commit/8d9d986ed431dae5ca8181c11d8825eb7f7a1ad0))


### Features

* **AFA-006:** add Helmet middleware for enhanced security headers and CORS ([4513740](https://github.com/OrelNaranjoD/akira-flex-api/commit/4513740e75b04843cee973cd463451e0501f6020))
* **AFA-008:** implement password reset and email verification features ([aab178f](https://github.com/OrelNaranjoD/akira-flex-api/commit/aab178f28bdb48f01462c30c52746dbb59fe6370))
* **AFA-117:** add Swagger and ServeStatic modules for API documentation and static file serving ([5228293](https://github.com/OrelNaranjoD/akira-flex-api/commit/52282930255c1e8380a40d16ce9ce5926f88f019))
* **AFA-237:** implement role management module with CRUD operations ([ecf826f](https://github.com/OrelNaranjoD/akira-flex-api/commit/ecf826f93a5af183d862bfbed3cf754dae6d9ced))
* **AFA-242 AFA-234 AFA-233:** implement CRUD operations ([1f40377](https://github.com/OrelNaranjoD/akira-flex-api/commit/1f40377f98eca71c317da7516dfa8605900f1df9))
* **AFA-252 AFA-009:** add mail module and service for sending verification emails ([66f6248](https://github.com/OrelNaranjoD/akira-flex-api/commit/66f62482f97be1fcfdf449bd227ae6e0408ef418))
* **ci:** add GitHub Actions workflows for build and validation ([5d68263](https://github.com/OrelNaranjoD/akira-flex-api/commit/5d68263ccdc4bdb76ba793b2528b27fdba1d4167))
* **tests:** refactor PlatformAuthService tests to use TokenService and MailService ([40f25a0](https://github.com/OrelNaranjoD/akira-flex-api/commit/40f25a05d77df791b0e337e1d92ff2f60f518d49))



# [0.2.0](https://github.com/OrelNaranjoD/akira-flex-api/compare/v0.1.0...v0.2.0) (2025-08-30)


### Bug Fixes

* **I-003:** add audit module and initial permissions/roles seeder ([36a244f](https://github.com/OrelNaranjoD/akira-flex-api/commit/36a244fe53ebca4cf9c20f4a87c3ef7c293ba7e1))


### Features

* **test:** mock AuditService in e2e tests for isolation ([51737bb](https://github.com/OrelNaranjoD/akira-flex-api/commit/51737bbd8f21e9afaa921c94d64355f26ee0010a))



# [0.1.0](https://github.com/OrelNaranjoD/akira-flex-api/compare/v0.0.5...v0.1.0) (2025-08-30)


### Features

* **AFA-001:** implement tenant authentication controller ([f469f12](https://github.com/OrelNaranjoD/akira-flex-api/commit/f469f129d9c41ab7a393125abff34765e4896c24))
* **AFA-005:** add AuditInterceptor for automatic logging of HTTP requests ([b76207b](https://github.com/OrelNaranjoD/akira-flex-api/commit/b76207ba0a9d95f8ecc14a132301e02b74e0e12f))
* **AFA-007:** add JWT strategies and token response DTOs for platform and tenant authentication ([1459c5a](https://github.com/OrelNaranjoD/akira-flex-api/commit/1459c5a934636018302f434fd66738ed3a2ab102))
* **AFA-011 AFA-012 AFA-013 AFA-014:** implement platform user management ([ce98ca6](https://github.com/OrelNaranjoD/akira-flex-api/commit/ce98ca63a7846a0f7194c3106bf60654db9772da))
* **AFA-031 AFA-032 AFA-033 AFA-034:** implement platform role management modules ([82992aa](https://github.com/OrelNaranjoD/akira-flex-api/commit/82992aac4ac541229f76fe28b3622977b7df7465))
* **AFA-035 AFA-036 AFA-037 AFA-038 AFA-039 AFA-040 AFA-041:** implement platform permissions ([d8420b7](https://github.com/OrelNaranjoD/akira-flex-api/commit/d8420b7fb96f9a10b62899a70e0fdc70605908a8))
* **AFA-118:** add status module with controller for health checks ([27a9714](https://github.com/OrelNaranjoD/akira-flex-api/commit/27a971476866ee05fb7ed18fc5a51773cb951cd2))
* **AFA-119:** add path mappings for definitions in tsconfig ([c32da39](https://github.com/OrelNaranjoD/akira-flex-api/commit/c32da390d6b3a8f77b6941f409d0e600ef69f365))
* **AFA-122 AFA-119 AFA-133:** update package dependencies and scripts ([4700bbe](https://github.com/OrelNaranjoD/akira-flex-api/commit/4700bbe6a4475f9433de4574a44eeef9da05f1f1))
* **AFA-129 AFA-130:** add interface, type, enumerator, and DTO definitions from flex-shared-lib ([c02c3b5](https://github.com/OrelNaranjoD/akira-flex-api/commit/c02c3b5732396df2368f1ee945c32ae0657a4c6b))
* **AFA-136:** add unit tests for auth and user management in tenant and platform ([88b40be](https://github.com/OrelNaranjoD/akira-flex-api/commit/88b40becfdb1fdbb72d08e3d101f98813df0e7e6))
* **AFA-180:** add status module with controller and unit tests for AppModule ([a455491](https://github.com/OrelNaranjoD/akira-flex-api/commit/a455491cd332126d419e7f5e7e30da3ad25a1fa4))
* **AFA-218.1:** add PlatformUserEntity for administrative user management ([e5a1bbf](https://github.com/OrelNaranjoD/akira-flex-api/commit/e5a1bbfa8222b980ff4fa25ba5d11eb8645b1e49))
* **AFA-218.2:** add DTOs for user registration, creation, update, and response handling ([b29c53c](https://github.com/OrelNaranjoD/akira-flex-api/commit/b29c53c327cea6eaa3d6df72a2bd0e8e35f657b4))
* **AFA-218.3:** implement UserPlatformService for managing platform users ([204ffde](https://github.com/OrelNaranjoD/akira-flex-api/commit/204ffde17a6736e5a109ccaeeaed0ea2a1cc4cf4))
* **AFA-218.4:** add UserPlatformController for managing platform users ([0417b48](https://github.com/OrelNaranjoD/akira-flex-api/commit/0417b48b0bcf73f37302e217d0b1c2240414d1e9))
* **AFA-218.7:** refactor environment configuration and add Jest setup for testing ([4021795](https://github.com/OrelNaranjoD/akira-flex-api/commit/40217956f5e4492dd1e89e0f40c9c62d8668020d))
* **AFA-228 AFA-207:** add database module and initial seeder for platform admin user ([2408fd9](https://github.com/OrelNaranjoD/akira-flex-api/commit/2408fd9095ee0a17a89964d7a1c99c2511e23a5e))
* **AFA-229:** implement audit logging functionality with controller, service, and entity ([ae7eab0](https://github.com/OrelNaranjoD/akira-flex-api/commit/ae7eab024755b4aa339400fb5eb8dfdba59d7f04))
* **AFA-230:** add platform authentication module, service, and user decorator ([eb83eb7](https://github.com/OrelNaranjoD/akira-flex-api/commit/eb83eb7039f7bda6d5de17d95ba18ba99f741256))
* **AFA-231 AFA-207:** add platform permissions and roles management ([d09b8b7](https://github.com/OrelNaranjoD/akira-flex-api/commit/d09b8b79acedf760376883db8df3781e6966b165))
* **AFA-231:** implement tenant user management module with DTOs, services, and controller ([ba3ea04](https://github.com/OrelNaranjoD/akira-flex-api/commit/ba3ea047d13eda60429d1402b30af5f37aab73c0))
* **AFA-232:** implement tenant management features ([fcc1f37](https://github.com/OrelNaranjoD/akira-flex-api/commit/fcc1f37e1e1ecf1cb14bc00eb7ce1dd4fdc2273e))
* **AFA-232:** implement tenant management module with DTOs, services, and controller ([c74d04b](https://github.com/OrelNaranjoD/akira-flex-api/commit/c74d04b582a29d52275ffbb2276bbce687c2904c))



## [0.0.5](https://github.com/OrelNaranjoD/akira-flex-api/compare/v0.0.4...v0.0.5) (2025-08-25)



## [0.0.4](https://github.com/OrelNaranjoD/akira-flex-api/compare/v0.0.3...v0.0.4) (2025-08-25)



## [0.0.3](https://github.com/OrelNaranjoD/akira-flex-api/compare/v0.0.2...v0.0.3) (2025-08-25)



## [0.0.2](https://github.com/OrelNaranjoD/akira-flex-api/compare/fc2ae832d91dbb008150ae0d8e0c854e95f2bfa2...v0.0.2) (2025-08-25)


### Bug Fixes

* **AFA-124:** configure npm for GitHub Packages and update token variable in workflows and README ([fc2ae83](https://github.com/OrelNaranjoD/akira-flex-api/commit/fc2ae832d91dbb008150ae0d8e0c854e95f2bfa2))
* update lint command to run without auto-fix ([a8478c8](https://github.com/OrelNaranjoD/akira-flex-api/commit/a8478c88b5dade1a9c19053478ba4e7ada3cd8e3))



