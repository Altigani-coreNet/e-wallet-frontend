/**

 * Customer profile API-only E2E (real backend — no dashboard UI)

 *

 * Flow:

 * 1. Register via API (OTP + register)

 * 2. Lookup country + city from select APIs

 * 3. Complete profile via multipart POST /profile/complete (with corenet.png)

 * 4. GET /profile — verify name, email, nationalId, picture, profileCompleted

 * 5. Update profile via multipart POST /profile/update (with corenet.png)

 * 6. GET /profile — verify updated name, gender, picture still present, email and nationalId unchanged

 *

 * Prerequisites:

 * - Backend at apiUrl (see cypress.config.js)

 * - OTP mock: OTP_MOCK_CODE=111111

 *

 * Run:

 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-profile-api.cy.js

 */



describe('Customer profile API (multipart, real backend)', () => {

    const password = 'ProfileApi1!';

    const runId = Date.now();



    let phone;

    let profileName;

    let profileEmail;

    let nationalId;

    let updatedNationalId;

    let updatedName;

    let authToken;

    let country;

    let city;



    beforeEach(() => {

        phone = `+2499${runId.toString().slice(-7)}${Math.floor(Math.random() * 10)}`;

        profileName = `API Profile ${runId}`;

        profileEmail = `api.profile.${runId}@example.com`;

        nationalId = `NID-${runId}`;

        updatedNationalId = `NID-UPDATED-${runId}`;

        updatedName = `API Profile Updated ${runId}`;

    });



    it('registers, completes profile with picture, updates profile with picture — all via API', () => {

        cy.apiOnboardCustomer({ phone, password }).then(({ customer, token }) => {

            expect(customer.phone).to.eq(phone);

            expect(token).to.be.a('string');

            authToken = token;

        });



        cy.apiLookupCountry({ search: 'Sudan' }).then((resolvedCountry) => {

            country = resolvedCountry;

            return cy.apiLookupCity({ dialCode: country.code, countryId: country.id });

        }).then((resolvedCity) => {

            city = resolvedCity;

        });



        cy.then(() => {

            cy.apiCompleteCustomerProfileMultipart({

                token: authToken,

                firstName: profileName,

                email: profileEmail,

                nationalId,

                cityId: city.id,

                countryCode: country.code,

                pictureFixture: 'corenet.png',

            }).then((completeResponse) => {

                expect(completeResponse.status).to.be.oneOf([200, 201]);



                const customer = completeResponse.body.data.customer;

                expect(customer.name).to.eq(profileName);

                expect(customer.email).to.eq(profileEmail);

                expect(customer.nationalId).to.eq(nationalId);

                expect(customer.profileCompleted).to.eq(true);

                expect(customer.profileImage).to.be.a('string').and.not.be.empty;

                expect(customer.cityId).to.eq(city.id);

                expect(customer.countryId).to.eq(country.id);

            });

        });



        cy.then(() => {

            cy.apiCustomerProfile(authToken).then((profileResponse) => {

                expect(profileResponse.status).to.eq(200);

                const profile = profileResponse.body.data.customer;

                expect(profile.name).to.eq(profileName);

                expect(profile.email).to.eq(profileEmail);

                expect(profile.nationalId).to.eq(nationalId);

                expect(profile.gender).to.eq('male');

                expect(profile.profileCompleted).to.eq(true);

                expect(profile.profileImage).to.be.a('string').and.not.be.empty;

            });

        });



        cy.then(() => {

            cy.apiUpdateCustomerProfileMultipart({

                token: authToken,

                firstName: updatedName,

                nationalId: updatedNationalId,

                cityId: city.id,

                countryCode: country.code,

                birthDate: '1992-08-10',

                gender: 'female',

                pictureFixture: 'corenet.png',

            }).then((updateResponse) => {

                expect(updateResponse.status).to.eq(200);



                const customer = updateResponse.body.data.customer;

                expect(customer.name).to.eq(updatedName);

                expect(customer.email).to.eq(profileEmail);

                expect(customer.phone).to.eq(phone);

                expect(customer.nationalId).to.eq(nationalId);

                expect(customer.gender).to.eq('female');

                expect(customer.profileCompleted).to.eq(true);

                expect(customer.profileImage).to.be.a('string').and.not.be.empty;

            });

        });



        cy.then(() => {

            cy.apiCustomerProfile(authToken).then((profileResponse) => {

                const profile = profileResponse.body.data.customer;

                expect(profile.name).to.eq(updatedName);

                expect(profile.email).to.eq(profileEmail);

                expect(profile.phone).to.eq(phone);

                expect(profile.nationalId).to.eq(nationalId);

                expect(profile.nationalId).to.not.eq(updatedNationalId);

                expect(profile.gender).to.eq('female');

                expect(profile.profileCompleted).to.eq(true);

                expect(profile.profileImage).to.be.a('string').and.not.be.empty;

            });

        });

    });

});


