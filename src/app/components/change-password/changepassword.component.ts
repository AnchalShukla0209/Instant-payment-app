import { Component, signal, ViewChild, inject, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../app-loader/loader.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { OTPPayload } from '../../models/login-payload.model';

@Component({
    selector: 'app-changepassword',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent],
    templateUrl: './changepassword.component.html',
    styleUrls: ['./changepassword.component.scss']
})
export class ChangePasswordComponent {
    @ViewChild('invoiceModal') invoiceModal: any;
    constructor(private toastr: ToastrService, private modalService: NgbModal) { }
    private authServiceobj = inject(AuthService);
    private router = inject(Router);
    selectedicon: string = 'bi-phone';
    showRecentTxns = false;
    sessionKey: string = "Ue3+U37PTedaLzeWuzX+DGJQJL3nGv5pPO+K3dVOrWU=";
    Name: string = '';
    PhoneNo: string = '';
    EmailID: string = '';
    PANNo: string = '';
    currentPassword: string = '';
    ConfirmPassword: string = '';
    inputPANNumber: string = '';
    inputAadhar: string = '';
    NewPassword: string = '';
    AadharNo: string = '';
    showTxnPin = false;
    showMPin = false;
    showAadharNo = false;
    showPanNo = false;
    showConfirmPass = false;
    showCurrentPassword = false;
    isLoading = false;
    otp: string = '';
    showInputAAdharError = false;
    showInputPANError = false;
    @ViewChild('previewModal') previewModalobj: any;

    toggleTxnPin() {
        this.showTxnPin = !this.showTxnPin;
    }

    toggleMPin() {
        this.showMPin = !this.showMPin;
    }

    togglePanNo() {
        this.showPanNo = !this.showPanNo;
    }

    toggleAadharNo() {
        this.showAadharNo = !this.showAadharNo;
    }

    toggleConfirmPass() {
        this.showConfirmPass = !this.showConfirmPass;
    }

    toggleCurrentPassword() {
        this.showCurrentPassword = !this.showCurrentPassword;
    }
    ngOnInit() {
        this.isLoading = true;
        this.sessionKey = this.authServiceobj.getSessionKey();
        const userId = this.authServiceobj.getUserId();
        const userName = this.authServiceobj.getUsername();
        if (!userId || !userName) {
            this.toastr.error('Session expired. Please login.');
            this.router.navigate(['/login']);
            return;
        }
        this.PhoneNo = this.authServiceobj.getUserPhoneNo();
        this.EmailID = this.authServiceobj.getUserEmailId();
        this.PANNo = this.authServiceobj.getUserPanCard();
        this.Name = this.authServiceobj.getUsername();
        this.AadharNo = this.authServiceobj.getUserAadharNumber();
        this.isLoading = false;
    }

    showFormErrors(form: FormGroup) {
        Object.keys(form.controls).forEach(field => {
            const control = form.get(field);
            if (control?.errors) {
                if (control.errors['required']) {
                    this.toastr.error(`${field} is required`);
                }
                if (control.errors['pattern']) {
                    this.toastr.error(`Invalid ${field}`);
                }
                if (control.errors['minlength']) {
                    this.toastr.error(`${field} is too short`);
                }
                if (control.errors['maxlength']) {
                    this.toastr.error(`${field} is too long`);
                }
            }

            control?.markAsTouched();
        });
    }

    CancelMoneyTransfer() {

        this.otp = "";
        this.modalService.dismissAll();

    }


    get colClass(): string {
        if (this.showRecentTxns) {
            return 'form-group';
        }

        return 'col-md-4';
    }

    get disableclass(): string {

        return 'disablecss'
    }

    toggleRecentTxns() {
        this.showRecentTxns = !this.showRecentTxns;
    }

    ValidateUser() {
        if (this.inputAadhar.trim() == "" && this.inputPANNumber.trim() == "") {
            this.toastr.error("Please Enter Aadhar Number And PAN Number!");
            this.showInputAAdharError = true;
            this.showInputPANError = true;
            return;
        }
        else if (this.inputAadhar.trim() == "" || this.inputAadhar.length < 12 || this.inputAadhar.length > 12) {
            this.toastr.error("Please Enter valid Aadhar Number!");
            this.showInputPANError = false;
            this.showInputAAdharError = true;
            return;
        }
        else if (this.inputPANNumber.trim() == "" || this.inputPANNumber.length < 10 || this.inputPANNumber.length > 10) {
            this.toastr.error("Please Enter valid PAN Number!");
            this.showInputAAdharError = false;
            this.showInputPANError = true;
            return;
        }

        else if (this.inputAadhar.trim() != this.AadharNo.toString().trim()) {
            this.toastr.error("Please Enter valid Aadhar Number!");
            this.showInputPANError = false;
            this.showInputAAdharError = true;
            return;
        }

        else if (this.inputPANNumber.trim() != this.PANNo.toString().trim()) {
            this.toastr.error("Please Enter valid PAN Number!");
            this.showInputPANError = true;
            this.showInputAAdharError = false;
            return;
        }
        else {
            const payload = {
                UserId: this.authServiceobj.getUserId().toString(),
                OldPassword: "",
                NewPassword: "",
                ConfirmPassword: "",
                Mode: '',
                PANNo: this.inputPANNumber.trim().toString(),
                AadharNo: this.inputAadhar.trim().toString()
            };
            this.isLoading = true;
            this.authServiceobj.ValidateUserInfo(payload).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    if (res.success) {
                        this.toastr.success("User Validated Successfully, Please Enter OTP And Change Password!");
                        this.authServiceobj.SaveOTPinCookies(res);
                        this.inputAadhar = "";
                        this.inputPANNumber = "";
                        this.modalService.open(this.previewModalobj, { size: 'lg', backdrop: 'static', keyboard: false });
                    } else {
                        this.toastr.error(res.message);
                        return;
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.toastr.error('Something went wrong');
                    console.error(err);
                }
            });
        }
    }

   

    updatePassword() {

        if (!this.currentPassword || !this.NewPassword || !this.ConfirmPassword) {
            this.toastr.error('All fields are required');
            return;
        }

        if (this.NewPassword !== this.ConfirmPassword) {
            this.toastr.error('New Password & Confirm Password must match');
            return;
        }

        if (!this.isPasswordValid(this.NewPassword)) {
            this.toastr.error(
                'Password must contain uppercase, lowercase, number & special character'
            );
            return;
        }

        if (this.authServiceobj.getUserOTP() != this.otp) {
            this.toastr.error('Please Enter Valid OTP!');
            return;
        }

        Swal.fire({
            title: 'Confirm Password Change',
            text: 'Are you sure you want to change your password?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Update',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#5a2b91',
            cancelButtonColor: '#6c757d'
        }).then((result) => {

            if (!result.isConfirmed) {
                return;
            }
            const payload = {
                UserId: this.authServiceobj.getUserId().toString(),
                OldPassword: this.currentPassword,
                NewPassword: this.NewPassword,
                ConfirmPassword: this.ConfirmPassword,
                Mode: ''
            };

            this.isLoading = true;

            this.authServiceobj.updateUserInfo(payload).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    if (res.success) {
                        this.toastr.success(res.message);
                        this.currentPassword = '';
                        this.NewPassword = '';
                        this.ConfirmPassword = '';
                        this.otp = '';
                        this.inputAadhar='';
                        this.inputPANNumber='';
                        this.modalService.dismissAll();
                    } else {
                        this.toastr.error(res.message);
                        return;
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.toastr.error('Something went wrong');
                    console.error(err);
                }
            });
        });
    }

    ResendOTP() {
        const payload: OTPPayload = {
            userid: this.authServiceobj.getUserId().toString(),
            usertype:
                this.authServiceobj
                    .getUsertype()
                    .toString()
                    .toLowerCase()
                    .trim() === 'rt' || this.authServiceobj.getUsertype().toLowerCase().trim()==='retailer'
                    ? 'Retailer'
                    : 'SuperAdmin',
                otp:""
        };

        this.authServiceobj.ResendOTPEnc(payload).subscribe({
            next: (res) => {
                this.toastr.success('OTP Sent Successfully!');
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Failed to resend OTP');
            }
        });
    }


    isPasswordValid(password: string): boolean {
        const regex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{};':"\\|,.<>\/]).{8,}$/;
        return regex.test(password);
    }


}
