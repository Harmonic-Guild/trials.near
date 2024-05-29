const { SidebarLayout } = VM.require("${config_account}/widget/SidebarLayout") || {
  SidebarLayout: () => <></>,
};

const config = {
  theme: {},
  layout: {
    //The layout at BuildDAO is not available
    src: "devs.near/widget/Layout",
    props: {
      variant: "standard",
    },
  },
  blocks: {
    // these get passed to the layout and children
    Header: () => <></>,
    Footer: () => <></>, // customize your footer
  },
  router: {
    param: "tab",
    routes: {
      guide: {
        path: "${config_account}/widget/Resources",
        blockHeight: "final",
        init: {
          feedName: "Guide",
          name: "Guide",
          icon: "bi-map",
          mdPath: "https://raw.githubusercontent.com/Harmonic-Guild/trials.near/main/docs.md",
        },
        default: "true",
      },
    },
  },
};

const Root = styled.div`
  margin-top: -2%;
`;

return (
  <Root>
    <SidebarLayout
      currentPath={"/${config_account}/widget/app?page=home"}
      page={props.tab}
      routes={config.router.routes}
    >
      <Widget src="${config_account}/widget/app.view" props={{ config, ...props }} />
    </SidebarLayout>
  </Root>
);
