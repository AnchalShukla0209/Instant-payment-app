import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OnboardingListItem, SalesTeamOnboardingService } from '../../services/sales-team-onboarding.service';

type ListView='all'|'draft'|'review'|'rejected'|'approved';
@Component({selector:'app-sales-team-dashboard',standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl:'./sales-team-dashboard.component.html',styleUrl:'./sales-team-dashboard.component.scss'})
export class SalesTeamDashboardComponent implements OnInit {
 private api=inject(SalesTeamOnboardingService);private route=inject(ActivatedRoute);
 private today(){const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);}
 loading=true;search='';fromDate=this.today();toDate=this.today();status='';page=1;pageSize=10;total=0;rows:OnboardingListItem[]=[];error='';view:ListView='all';showCounts=true;
 counts={draft:0,pending:0,rejected:0,approved:0};
 ngOnInit(){this.route.queryParamMap.subscribe(p=>{const requested=p.get('view') as ListView|null;this.showCounts=!requested;this.view=requested&&['draft','review','rejected','approved'].includes(requested)?requested:'all';this.status=this.view==='draft'?'Draft':this.view==='review'?'Review':this.view==='rejected'?'Rejected':this.view==='approved'?'Approved':'';this.page=1;this.loadDashboard();});}
 loadDashboard(){this.loading=true;forkJoin({draft:this.api.list({pageIndex:1,pageSize:1,status:'Draft'}),pending:this.api.list({pageIndex:1,pageSize:1,status:'PendingReview'}),rereview:this.api.list({pageIndex:1,pageSize:1,status:'PendingReReview'}),rejected:this.api.list({pageIndex:1,pageSize:1,status:'Rejected'}),approved:this.api.list({pageIndex:1,pageSize:1,status:'Approved'})}).subscribe({next:r=>{this.counts={draft:r.draft.data.totalCount,pending:r.pending.data.totalCount+r.rereview.data.totalCount,rejected:r.rejected.data.totalCount,approved:r.approved.data.totalCount};this.loadList();},error:e=>{this.loading=false;this.error=e.error?.message||'Dashboard could not be loaded.';}});}
 selectView(view:ListView){this.view=view;this.status=view==='draft'?'Draft':view==='review'?'Review':view==='rejected'?'Rejected':view==='approved'?'Approved':'';this.page=1;this.loadList();}
 loadList(){if(this.fromDate&&this.toDate&&this.fromDate>this.toDate){this.error='From Date cannot be later than To Date.';return;}this.loading=true;this.error='';this.api.list({pageIndex:this.page,pageSize:this.pageSize,search:this.search,status:this.status,fromDate:this.fromDate,toDate:this.toDate}).subscribe({next:r=>{this.rows=r.data.data;this.total=r.data.totalCount;this.loading=false;},error:e=>{this.loading=false;this.error=e.error?.message||'Applications could not be loaded.';}});}
 reset(){this.search='';this.fromDate=this.today();this.toDate=this.today();this.page=1;this.selectView('all');}
 roleName(type:string){return ({RT:'Retailer',AD:'Distributor',MD:'Master Distributor'} as Record<string,string>)[type]||type||'—';}
 changePage(delta:number){const next=this.page+delta;if(next<1||next>Math.ceil(this.total/this.pageSize))return;this.page=next;this.loadList();}
}
